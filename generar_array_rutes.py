'''
cd /home/joan/rutesgps/v6/
python3 generar_array_rutes_v4.py
'''
import os
import xml.etree.ElementTree as ET

import unicodedata

def strip_accents(text):
    try:
        text = unicode(text, 'utf-8')
    except (TypeError, NameError): # unicode is a default on python 3 
        pass
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore')
    text = text.decode("utf-8")
    return str(text)


arr = os.listdir('./rutesgps')

f = open("./js_btt/llista_rutes.js", "w")

lst_modalitats = list()
lst_zones = list()
lst_dicts = list() # és una llista de diccionaris

comptador = 0
for x in range(0,len(arr)):
#for x in range(0,6):
	if (".gpx" in arr[x]):
		tree = ET.parse("./rutesgps/" + arr[x])
		root = tree.getroot()
		for child in root:
			if (child.tag.find("metadata")>=0):
				for child2 in child:
					if (child2.tag.find("name")>=0):
						name = child2.text
					elif(child2.tag.find("desc")>=0):
						desc = child2.text
						desc_arr = desc.split("*")
						modalitat = desc_arr[0]
						zona = desc_arr[1]
						if (modalitat not in lst_modalitats):
							lst_modalitats.append(modalitat)
						if (zona not in lst_zones): # zona nova
							lst_zones.append(zona)
						lst_dicts.append([])
						dict_ruta = { "ruta": name, "fitxer": arr[x] }
				break
		ind = lst_zones.index(zona)
		lst_dicts[ind].append(dict_ruta)

		comptador = comptador + 1


f.write("// al final de tot hi ha un export\n")
f.write("function llista_rutes() {\n")
f.write("\tvar rutes = [\n")

compt = 0
for zona in lst_zones:
	if (compt > 0):
		f.write(",\n")	
	f.write("\t\t{")
	f.write("\"zona\":\"" + zona + "\",")
	id_zona = strip_accents(zona.lower().replace(" ", "_"))
	f.write("\"id\":\"" + id_zona + "\",")
	f.write("\"rutes\":[")
	compt2 = 0
	for dicc in lst_dicts[compt]:
		if (compt2 > 0):
			f.write(",")	
		f.write("\n\t\t\t{\"ruta\":\"" + dicc['ruta'] + "\", \"fitxer\":\"" + dicc['fitxer'] + "\"}")
		compt2 = compt2 + 1
	f.write("\n\t\t]")
	f.write("}")
	compt = compt + 1

f.write("\n\t];\n")
f.write("\n\treturn rutes;\n")
f.write("}\n")
f.write("\nexport default llista_rutes;\n")
f.close()
print("Hem generat ./js_btt/llista_rutes.js")

# =====================================================

f = open("./js_btt/llista_modalitats.js", "w")

f.write("// al final de tot hi ha un export\n")
f.write("function llista_modalitats() {\n")
f.write("\tvar modalitats = [\n")
comptador = 0
for modalitat in lst_modalitats:
	if (comptador > 0):
		f.write(",\n")
	f.write("\t{\n")
	f.write("\t\t\"modalitat\":\"" + modalitat + "\",\n")
	id_modalitat = strip_accents(modalitat.lower().replace(" ", "_"))
	f.write("\t\t\"value\":\"" + id_modalitat + "\",\n")
	f.write("\t\t\"id\":\"chk_" + id_modalitat + "\"\n")
	f.write("\t}")
	comptador = comptador + 1
f.write("\n\t]\n\n")
f.write("\treturn modalitats;\n")
f.write("}")
f.write("\nexport default llista_modalitats;\n")

f.close()
print("Hem generat ./js_btt/llista_modalitats.js")