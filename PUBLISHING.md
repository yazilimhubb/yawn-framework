# npm'e publish etme rehberi

## 1. npm hesabı aç

https://www.npmjs.com/signup adresinden hesap oluştur.

## 2. Giriş yap

```bash
npm login
```

## 3. npm scope oluştur (scoped paketler için)

`@yawn/` scope'u kullanmak istiyorsun. npm'de bu scope sana ait olmalı:
- npmjs.com'da hesabınla giriş yap
- `@yawn` organizasyonu oluştur (ücretsiz): https://www.npmjs.com/org/create

Eğer `@yawn` adı alınmışsa, kendi kullanıcı adını kullan: `@const/reactivity` gibi.

## 4. `package.json`'lardaki URL'leri güncelle

`your-username` yazan yerler zaten güncellendi. Eğer scope değiştirirsen:

```bash
# PowerShell ile toplu değiştir
Get-ChildItem -Recurse -Filter package.json | ForEach-Object {
  (Get-Content $_.FullName) -replace 'yazilimhubb', 'YENI_ISIM' | Set-Content $_.FullName
}
```

## 5. Paketleri yayınla

Ana paketi (`yawn-framework`) yayınla:

```bash
cd packages/core
npm publish --access public
```

Scoped paketleri yayınla:

```bash
cd packages/reactivity && npm publish --access public
cd packages/compiler   && npm publish --access public
cd packages/router     && npm publish --access public
cd packages/server     && npm publish --access public
cd packages/dev-server && npm publish --access public
cd packages/runtime    && npm publish --access public
cd packages/shared     && npm publish --access public
cd packages/devtools   && npm publish --access public
cd packages/cli        && npm publish --access public
```

## 6. Versiyon yönetimi

Yeni bir şey ekleyince versiyon artır:

```bash
# patch: 0.1.0 → 0.1.1 (bug fix)
npm version patch

# minor: 0.1.0 → 0.2.0 (yeni özellik)
npm version minor

# major: 0.1.0 → 1.0.0 (breaking change)
npm version major
```

## 7. GitHub'a push et

```bash
git add .
git commit -m "release: v0.1.0"
git push origin main
git tag v0.1.0
git push origin v0.1.0
```
