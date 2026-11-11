# Raspberry Pi Imager's repository format: one entry, the latest Cecilia
# image. "init_format": "systemd" lets Imager's OS customisation (user,
# password, Wi-Fi, SSH, time zone) apply to it.
{
  "os_list": [
    {
      "name": ("Cecilia " + $version),
      "description": "Organ recorder and player for churches. Raspberry Pi OS Lite (64-bit) with Cecilia ready to go: open http://cecilia.local:7070 after it starts.",
      "icon": $icon,
      "website": "https://garethcheyne.github.io/cecilia-site/",
      "url": $url,
      "release_date": $date,
      "image_download_size": $dsize,
      "image_download_sha256": $dsha,
      "extract_size": $esize,
      "extract_sha256": $esha,
      "init_format": "systemd",
      "devices": ["pi5-64bit", "pi4-64bit", "pi3-64bit"]
    }
  ]
}
