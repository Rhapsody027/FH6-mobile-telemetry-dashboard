# fh6-hub/discovery.py
import ipaddress
import socket
from typing import Optional

import ifaddr
from zeroconf import IPVersion, NonUniqueNameException, ServiceInfo
from zeroconf.asyncio import AsyncZeroconf

BLOCKED_ADAPTER_KEYWORDS = (
    "virtual",
    "loopback",
    "docker",
    "tailscale",
    "vpn",
    "hamachi",
    "wireguard",
    "hyper-v",
    "vbox",
    "vmware",
    "bridge",
    "bluetooth",
    "pseudo",
    "tap",
    "tun",
    "wsl",
    "teredo",
    "wi-fi direct",
    "wireless direct",
)

PREFERRED_ADAPTER_KEYWORDS = (
    "wi-fi",
    "wifi",
    "wireless",
    "ethernet",
    "gbe",
    "lan",
)


class HubDiscovery:
    def __init__(self, port: int = 8765):
        self.port = port
        self.aio_zeroconf = None
        self.service_info = None
        self.is_registered = False
        self.last_error: str | None = None
        # 🚀 產品化規格：使用固定且具有識別性的 Device ID
        self.device_id = "time4ttack-fh6-hub-device"

    def _is_blocked_adapter(self, adapter_name: str) -> bool:
        lower_name = adapter_name.lower()
        return any(keyword in lower_name for keyword in BLOCKED_ADAPTER_KEYWORDS)

    def _adapter_score(self, adapter_name: str) -> int:
        lower_name = adapter_name.lower()
        score = 0
        for keyword in PREFERRED_ADAPTER_KEYWORDS:
            if keyword in lower_name:
                score += 10
        if "realtek" in lower_name or "intel" in lower_name:
            score += 5
        return score

    def get_local_ip(self) -> Optional[str]:
        candidates: list[tuple[int, int, str]] = []

        for order, adapter in enumerate(ifaddr.get_adapters()):
            adapter_name = getattr(adapter, "nice_name", "") or ""
            if self._is_blocked_adapter(adapter_name):
                continue

            adapter_score = self._adapter_score(adapter_name)

            for address in adapter.ips:
                ip_value = getattr(address, "ip", None)
                if not isinstance(ip_value, str):
                    continue

                try:
                    ipv4 = ipaddress.IPv4Address(ip_value)
                except ipaddress.AddressValueError:
                    continue

                if (
                    ipv4.is_loopback
                    or ipv4.is_link_local
                    or ipv4.is_multicast
                    or ipv4.is_reserved
                    or not ipv4.is_private
                ):
                    continue

                candidates.append((adapter_score, order, str(ipv4)))

        if not candidates:
            self.last_error = (
                "找不到可用的 LAN IPv4，請確認 Hub 主機已連上同一個 Wi‑Fi 或乙太網路。"
            )
            return None

        candidates.sort(key=lambda item: (-item[0], item[1]))
        self.last_error = None
        return candidates[0][2]

    def get_pair_url(self) -> Optional[str]:
        local_ip = self.get_local_ip()
        if not local_ip:
            return None

        return f"time4ttack://pair?host={local_ip}&port={self.port}"

    def get_pairing_error(self) -> str | None:
        return self.last_error

    async def start(self):
        self.aio_zeroconf = AsyncZeroconf(ip_version=IPVersion.V4Only)
        self.is_registered = False
        local_ip = self.get_local_ip()

        if not local_ip:
            print(f"[mDNS] {self.last_error}")
            await self.aio_zeroconf.async_close()
            self.aio_zeroconf = None
            return False

        hostname = socket.gethostname()

        # 🚀 產品化規格：Properties 屬性對齊
        desc = {
            "device_id": self.device_id,
            "version": "1.0.0",
            "websocket_port": str(self.port),
        }

        # 🚀 產品化規格：
        # Service Type: _fh6hub._tcp.local.
        # Name: Time4ttack-FH6-Hub._fh6hub._tcp.local.
        self.service_info = ServiceInfo(
            "_fh6hub._tcp.local.",
            "Time4ttack-FH6-Hub._fh6hub._tcp.local.",
            addresses=[socket.inet_aton(local_ip)],
            port=self.port,
            properties=desc,
            server=f"{hostname}.local.",
        )

        print(f"[mDNS] 正在廣播服務: {self.service_info.name}")
        print(f"[mDNS] 廣播 IP: {local_ip}:{self.port}")
        try:
            await self.aio_zeroconf.async_register_service(
                self.service_info,
                allow_name_change=True,
            )
            self.is_registered = True
        except NonUniqueNameException as exc:
            print(f"[mDNS] 服務名稱衝突，略過廣播但 Hub 仍繼續啟動: {exc}")
            self.service_info = None
            self.is_registered = False
            await self.aio_zeroconf.async_close()
            self.aio_zeroconf = None

        return self.is_registered

    async def stop(self):
        if self.aio_zeroconf and self.service_info and self.is_registered:
            print("[mDNS] 正在註銷服務...")
            await self.aio_zeroconf.async_unregister_service(self.service_info)
            await self.aio_zeroconf.async_close()
        elif self.aio_zeroconf:
            await self.aio_zeroconf.async_close()

        self.aio_zeroconf = None
        self.service_info = None
        self.is_registered = False
