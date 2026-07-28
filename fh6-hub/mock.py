# fh6-hub/mock_replayer.py
import math
import socket
import struct
import time


# 構造與 Forza telemetry 100% 相同字節長度的假數據封包 (324 bytes)
# 這樣我們就不需要更動任何解包與前端邏輯！
def create_mock_packet(tick: int) -> bytes:
    packet = bytearray(324)

    rpm_max = 8000.0

    # 一個 Loop 約 16 秒
    cycle = tick % 960
    phase = cycle / 960.0

    #
    # Default
    #
    throttle = 0.0
    brake = 0.0
    steer = 0.0
    speed = 0.0
    rpm = 1500.0
    gear = 1

    lat_accel = 0.0
    long_accel = 0.0

    slip_ratio_fl = 0.0
    slip_ratio_fr = 0.0
    slip_ratio_rl = 0.0
    slip_ratio_rr = 0.0

    #
    # 0~20%
    # Launch + Full throttle
    #
    if phase < 0.20:
        p = phase / 0.20

        throttle = 1.0
        brake = 0.0

        speed = 8 + p * 60

        rpm = 2500 + p * 5000

        gear = min(3, int(p * 3) + 1)

        long_accel = 6.5

        # 起步燒胎
        if p < 0.15:
            slip_ratio_rl = 1.8
            slip_ratio_rr = 1.8

    #
    # 20~45%
    # 全油門直線加速 + 換檔
    #
    elif phase < 0.45:
        p = (phase - 0.20) / 0.25

        throttle = 1.0
        brake = 0.0

        speed = 68 + p * 90

        gear = min(6, int(p * 4) + 3)

        shift_phase = (p * 4) % 1

        if shift_phase < 0.10:
            rpm = 7600
        else:
            rpm = 5200 + shift_phase * 2000

        long_accel = 3.8

        slip_ratio_rl = 0.25
        slip_ratio_rr = 0.25

    #
    # 45~55%
    # Lift
    #
    elif phase < 0.55:
        p = (phase - 0.45) / 0.10

        throttle = 0.15
        brake = 0.0

        speed = 160 - p * 8

        rpm = 5500

        gear = 6

        long_accel = -0.8

    #
    # 55~70%
    # Full Brake + ABS
    #
    elif phase < 0.70:
        p = (phase - 0.55) / 0.15

        throttle = 0.0
        brake = 1.0

        speed = 152 - p * 95

        rpm = 5000 - p * 2200

        gear = 6 - int(p * 3)

        long_accel = -10.5

        # ABS
        pulse = (tick // 2) % 2

        if pulse:
            slip_ratio_fl = -1.6
            slip_ratio_fr = -1.6

        else:
            slip_ratio_fl = -0.2
            slip_ratio_fr = -0.2

    #
    # 70~85%
    # Trail Braking
    #
    elif phase < 0.85:
        p = (phase - 0.70) / 0.15

        throttle = 0.10

        brake = 0.75 * (1 - p)

        speed = 58 - p * 20

        rpm = 3300

        gear = 3

        steer = math.sin(p * math.pi / 2)

        lat_accel = 8.5 * math.sin(p * math.pi / 2)

        long_accel = -4.0 * (1 - p)

        slip_ratio_fl = -0.45
        slip_ratio_fr = -0.45

    #
    # 85~100%
    # Corner Exit
    #
    else:
        p = (phase - 0.85) / 0.15

        throttle = p

        brake = 0.0

        speed = 38 + p * 52

        rpm = 3200 + p * 3500

        gear = 3 + int(p * 2)

        steer = math.sin((1 - p) * math.pi / 2)

        lat_accel = 7.5 * (1 - p)

        long_accel = 5.5 * p

        if throttle > 0.75:
            slip_ratio_rl = 1.2
            slip_ratio_rr = 1.2

    #
    # 寫入封包
    #
    struct.pack_into("<f", packet, 8, rpm_max)
    struct.pack_into("<f", packet, 16, rpm)
    struct.pack_into("<f", packet, 20, lat_accel)
    struct.pack_into("<f", packet, 28, long_accel)

    struct.pack_into(
        "<ffff",
        packet,
        84,
        slip_ratio_fl,
        slip_ratio_fr,
        slip_ratio_rl,
        slip_ratio_rr,
    )

    d = 244

    struct.pack_into("<f", packet, d + 12, speed)

    struct.pack_into("<B", packet, d + 71, int(max(0, min(255, throttle * 255))))
    struct.pack_into("<B", packet, d + 72, int(max(0, min(255, brake * 255))))
    struct.pack_into("<B", packet, d + 75, gear)
    struct.pack_into("<b", packet, d + 76, int(max(-127, min(127, steer * 127))))

    return bytes(packet)
    # 建立一個 324 bytes 的空白 bytearray
    packet = bytearray(324)

    # 用正弦波模擬車輛數據
    rpm_max = 8000.0
    rpm = 2000.0 + (math.sin(tick * 0.05) + 1.0) * 2500.0  # 2000~7000rpm 循環
    speed_ms = 10.0 + (math.sin(tick * 0.02) + 1.0) * 30.0  # ~144 km/h
    gear = int((rpm / 1000.0)) % 6 + 1  # 模擬自動換檔 1~6 檔  # noqa: UP034

    # 煞車與油門
    throttle = (math.sin(tick * 0.03) + 1.0) / 2.0
    brake = 1.0 - throttle if throttle > 0.7 else 0.0
    steer = math.sin(tick * 0.04)  # 模擬左右打方向盤

    # G 值
    lat_accel = math.sin(tick * 0.04) * 8.0  # 模擬橫向加速度
    long_accel = -5.0 if brake > 0.5 else 3.0

    # 模擬胎滑
    slip_ratio_fl = -1.2 if brake > 0.8 else 0.0  # 前輪模擬鎖死
    slip_ratio_fr = -1.2 if brake > 0.8 else 0.0
    slip_ratio_rl = 1.5 if throttle > 0.9 else 0.0  # 後輪模擬燒胎
    slip_ratio_rr = 1.5 if throttle > 0.9 else 0.0

    # 寫入二進位緩衝區（依照 decoder.ts 的偏移量打包）
    # offset 8: rpmMax (float32)
    struct.pack_into("<f", packet, 8, rpm_max)
    # offset 16: rpm (float32)
    struct.pack_into("<f", packet, 16, rpm)
    # offset 20: latAccel (float32)
    struct.pack_into("<f", packet, 20, lat_accel)
    # offset 28: longAccel (float32)
    struct.pack_into("<f", packet, 28, long_accel)

    # 輪胎 Slip Ratio (offset 84: fl, fr, rl, rr - 4個 float32)
    struct.pack_into(
        "<ffff", packet, 84, slip_ratio_fl, slip_ratio_fr, slip_ratio_rl, slip_ratio_rr
    )

    # Base offset d = 244
    d = 244
    # d + 12: Speed (float32)
    struct.pack_into("<f", packet, d + 12, speed_ms)
    # d + 71: Throttle (u8)
    struct.pack_into("<B", packet, d + 71, int(throttle * 255))
    # d + 72: Brake (u8)
    struct.pack_into("<B", packet, d + 72, int(brake * 255))
    # d + 75: Gear (u8)
    struct.pack_into("<B", packet, d + 75, gear)
    # d + 76: Steer (s8)
    struct.pack_into("<b", packet, d + 76, int(steer * 127))

    return bytes(packet)


def start_replayer():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    target_address = ("127.0.0.1", 5300)

    print("[Replayer] 虛擬模擬器啟動！正在往 127.0.0.1:5300 噴射 60Hz 假數據...")
    print("[Replayer] 提示：開啟此程式後，請在另一個 terminal 啟動 main.py 接收它！")

    tick = 0
    try:
        while True:
            packet = create_mock_packet(tick)
            sock.sendto(packet, target_address)
            tick += 1
            # 60Hz 發送
            time.sleep(1 / 60.0)
    except KeyboardInterrupt:
        print("\n[Replayer] 模擬器已手動關閉。")


if __name__ == "__main__":
    start_replayer()
