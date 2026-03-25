import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://raw.githubusercontent.com/tk120404/thirukkural/master/thirukkural.json"
response = urllib.request.urlopen(url, context=ctx)
data = json.loads(response.read().decode('utf-8'))

# Assuming data format has 'kural' array
# We need id <= 1080
kurals = data['kural']
filtered_kurals = [k for k in kurals if k['Number'] <= 1080]

out_data = []
for k in filtered_kurals:
    out_data.append({
        "number": k["Number"],
        "line1": k["Line1"],
        "line2": k["Line2"],
        "translation": k.get("Translation", k.get("explanation", ""))
    })

with open("src/assets/kurals.js", "w", encoding="utf-8") as f:
    f.write("const THIRUKKURAL_DATA = " + json.dumps(out_data, ensure_ascii=False) + ";\n")
