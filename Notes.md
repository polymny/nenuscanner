# Notes

## Reset appareil photo

Après reset de l'appareil photo, l'appli ne fonctionne plus. J'ai du faire quelques modifs :

- `gphoto2 --set-config capturetarget=1` : sans ça, les photos ne sont pas stockées sur la SD de l'appareil photo, et
  donc pas récupérable par la pi,

## Raw et preview

J'ai du faire en sorte que la caméra acquiert à la fois le raw et le preview. J'ai eu besoin de lancer cette commande :
```
gphoto2 --set-config imageformat=11
```

Ca change le `imageformat` à la variante 11 _RAW + Medium Normal JPEG_ :

```
Label: Image Format
Readonly: 0
Type: RADIO
Current: RAW + Small Normal JPEG
Choice: 0 Large Fine JPEG
Choice: 1 Large Normal JPEG
Choice: 2 Medium Fine JPEG
Choice: 3 Medium Normal JPEG
Choice: 4 Small Fine JPEG
Choice: 5 Small Normal JPEG
Choice: 6 RAW + Large Fine JPEG
Choice: 7 RAW + Large Normal JPEG
Choice: 8 RAW + Medium Fine JPEG
Choice: 9 RAW + Medium Normal JPEG
Choice: 10 RAW + Small Fine JPEG
Choice: 11 RAW + Small Normal JPEG
Choice: 12 mRAW + Large Fine JPEG
Choice: 13 mRAW + Large Normal JPEG
Choice: 14 mRAW + Medium Fine JPEG
Choice: 15 mRAW + Medium Normal JPEG
Choice: 16 mRAW + Small Fine JPEG
Choice: 17 mRAW + Small Normal JPEG
Choice: 18 sRAW + Large Fine JPEG
Choice: 19 sRAW + Large Normal JPEG
Choice: 20 sRAW + Medium Fine JPEG
Choice: 21 sRAW + Medium Normal JPEG
Choice: 22 sRAW + Small Fine JPEG
Choice: 23 sRAW + Small Normal JPEG
Choice: 24 RAW
Choice: 25 mRAW
Choice: 26 sRAW
END
```

J'ai aussi un peu changé la façon dont on fait la preview, avant on récupérait le jpg directement depuis la pi, puis on
redimenssionnait. L'option est maintenant différente, donc on acquiert la preview comme ça :

```python
# Avant
def save(self, capture, output_file):
    preview = self.inner.file_get(capture.folder, capture.name[:-3] + 'JPG', gp.GP_FILE_TYPE_NORMAL)
    raw = self.inner.file_get(capture.folder, capture.name, gp.GP_FILE_TYPE_RAW)
    preview.save(output_file + '.jpg')
    # Resize preview
    subprocess.run(['convert', output_file + '.jpg', '-resize', '10%', output_file + '.jpg'])
    raw.save(output_file + '.cr2')

# Après
def save(self, capture, output_file):
    preview = self.inner.file_get(capture.folder, capture.name, gp.GP_FILE_TYPE_PREVIEW)
    raw = self.inner.file_get(capture.folder, capture.name, gp.GP_FILE_TYPE_RAW)
    preview.save(output_file + '.jpg')
    raw.save(output_file + '.cr2')
```
