#!/bin/bash -e
# Add Cecilia to Raspberry Pi OS Lite: the package from the Cecilia release
# (checked by the build against its SHA-256 before it gets here), and the
# network name. Cecilia keeps itself up to date after that.

install -m 644 files/cecilia.deb "${ROOTFS_DIR}/tmp/cecilia.deb"
on_chroot <<CHROOT
apt-get install -y /tmp/cecilia.deb avahi-daemon
# Keep the package, so Cecilia can go back to it after its first update.
VERSION=\$(dpkg-deb -f /tmp/cecilia.deb Version | sed 's/-[0-9]*$//')
mkdir -p /var/lib/cecilia-updater
chmod 700 /var/lib/cecilia-updater
cp /tmp/cecilia.deb "/var/lib/cecilia-updater/cecilia_\${VERSION}.deb"
rm /tmp/cecilia.deb
systemctl enable cecilia.service cecilia-update.path
# Listen on the network out of the box; the first thing the guide asks for
# is a password.
sed -i 's/^#\?CECILIA_ADDR=.*/CECILIA_ADDR=0.0.0.0:7070/' /etc/default/cecilia
CHROOT
