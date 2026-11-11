#!/bin/bash -e
# Cecilia's look, from power-on to sign-in:
#   - no rainbow square from the firmware, no kernel text or penguins;
#   - the Cecilia start-up screen (Plymouth) while it boots and shuts down;
#   - a Cecilia banner, with the address to open, on the sign-in screen;
#   - a Cecilia welcome, with its status, after signing in.

THEME_DIR="${ROOTFS_DIR}/usr/share/plymouth/themes/cecilia"
install -d "${THEME_DIR}"
install -m 644 files/plymouth/cecilia/* "${THEME_DIR}/"

install -m 644 files/issue "${ROOTFS_DIR}/etc/issue"
install -m 755 files/10-cecilia "${ROOTFS_DIR}/etc/update-motd.d/10-cecilia"
# Replace Debian's notice and the kernel line with Cecilia's welcome.
: >"${ROOTFS_DIR}/etc/motd"
rm -f "${ROOTFS_DIR}/etc/update-motd.d/10-uname"

on_chroot <<CHROOT
apt-get install -y --no-install-recommends plymouth plymouth-label
plymouth-set-default-theme cecilia
update-initramfs -u -k all
CHROOT

# Firmware: no rainbow splash.
CONFIG="${ROOTFS_DIR}/boot/firmware/config.txt"
grep -q '^disable_splash=1' "${CONFIG}" || printf '\n# Cecilia: no rainbow square at power-on\ndisable_splash=1\n' >>"${CONFIG}"

# Kernel: quiet, with the splash, no logo or cursor, and no text on the
# serial console stealing the screen.
CMDLINE="${ROOTFS_DIR}/boot/firmware/cmdline.txt"
sed -i -E 's/ (quiet|splash|loglevel=[0-9]|logo\.nologo|vt\.global_cursor_default=[0-9]|plymouth\.ignore-serial-consoles)//g' "${CMDLINE}"
sed -i -E '1 s/$/ quiet splash loglevel=3 logo.nologo vt.global_cursor_default=0 plymouth.ignore-serial-consoles/' "${CMDLINE}"
