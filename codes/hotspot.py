# -*- coding: utf-8 -*-
"""

@author: Lakshmi Priya
"""

import subprocess
import re

results = subprocess.check_output(["netsh", "wlan", "show", "network"])
results=results.decode("ascii")
results = results.replace("\r","")
#print(results)

results = results.replace("\n","")

results = results.replace("SSID", "*SSID")
results = results.replace("Network type", "*Network type")
hotspots = [i.replace("*", "").split(':')[1].strip() for i in re.findall(r'\*.*?\*', results)] 

answer = ""
for hotspot in hotspots:
    answer = answer + "*" + hotspot

print(answer)


