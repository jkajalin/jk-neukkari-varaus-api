#Yksinkertainen neukkarin varaus API



## API:n kättö ja kännistys

  - npm start - APIn käynnistys.
  - npm run dev - Käynnistää APIN dev modessa.
  - npm test tai pnpm test - Käynnistää testit.
  - Muut käyttöön määritelly skriptit package määrittelystä.

## Käytössä olevat routet
- http pyynnöillä:
- /api/users - Käyttäjien listaus GET pyynnöllä, Käyttäjien luonti POST pyynnölllä + autentikointi headeri*
- /api/users/:id - Käyttäjän poisto DELETE pyynnöllä, vaatii autentikoinnin
- /api/login - Käyttäjän kirjautuminen GET pyynnöllä - vaatii username, password kentät request bodyssa
- /api/rooms - Listaus GET pyynnöllä. Neukkarin luonti POST pyynnöllä.
- /api/rooms/:id - Neukkarin poisto DELETE pyynnöllä, vaatii autentikoinnin
- /api/reservations - Neukkari varauksen tekeminen POST pyynnöllä
- /api/reservations/:id - Neukkarin poisto DELETE pyynnöllä
- /api/reservations/:roomId - Huoneen varausten listaus GET pyynnöllä

- muut mahdolliset routet dokumentoinnissa
##
