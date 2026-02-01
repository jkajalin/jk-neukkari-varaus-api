# ANALYYSIT.md
### Oletuksia:
- Kaikki dokumentointi ja "piirrustukset" on olemasasa, sisältäen datamodelit.
- Sovelluskehitystä on tarkoitus jatkaa.
- Mongoose, GraphQL tai joku vastaava on tarkoitus ottaa käyttöön
- Datan sanitoinnista ja validoinnista huolehditaan kunnollla  fronttipuolella. Tehdään oletus että API:lle tulevat pyynnöt sanitoidaan frontti puolella.
- Tietoturvasta huolehditaan myös fronttipuolella.
- Sovellus ei ole tulossa tälläisenään tuotantokäyttöön, korkeintaan varhaisen vaiheen demoksi.
-  
- API:n pyynnöt ovat yksinkertaisuuden vuoksi http muossa. Oikeassa aplikaatiossa pitäisi huolehtia että ne on https muodossa. Esimerkiksi. fly.io palveluun ladatussa sovelluksessa alusta huolehtii https pyynnöistä automaattisesti.
-
- Vain ensimmäinen käyttäjä voidaan luoda ilman autentikointia. Tavallaan admin rooli. Ei välttämättä kauhean hyvä ratkaisu todelliseen tuotantosovellukseen. Toisaalta toteutuksen ratkaisussa tämä on toimiva keino, jos oletuksena on että kuka tahansa voi tehdä varauksia kirjautumatta. API ja aplikaatio saattaisi olla saatavilla vain yrityksen sisäverkossa oleleville
-
- Täysin suojaamaton yhteys ei ole hyvä käytäntö tietoturvanäkökulmasta.
- Tehdään oletus että alusta huolehtii SSL salauksesta tai VPN tunnelista API:lle
- Salasanat olisi hyvä tarkistaa salasanalistoja vastaan ennen kuin ne sallitaan käyttöön. (Yleisimmät salasanat).
- OWASP top 10, huomioidaan kehityksen myöhemmässä vaiheessa.
- CORS lisätään mahdollisesti projektiin myöhemmin.
- 

## ANALYYSIä:
---
1. Mitä tekoäly teki hyvin?
2. Mitä tekoäly teki huonosti?
3. Mitkä olivat tärkeimmät parannukset, jotka teit tekoälyn tuottamaan koodiin ja miksi?
---

1. Mitä tekoäly teki hyvin?
- Paljon koodia syntyi nopeasti
- Projektin "vaatimukset" täyttävä API oli valmiina nopeasti. Toiminta, toimintalogiikka, tekniset reunaehdot.
- Teki kattavat testit
- Attoi metsästämään virheitä ja bugeja tehokkaasti
- Refaktoroi tehokkaasti testit vastaamaan päivittynytta koodi kontekstia. Varsinkin kun edettiin tiedosto kerralla jotta muutosten määrä pysyy paremmin hallinnassa
- Nopeutti kehitystä kun kirjoitin itse yksinkertaistettuja testejä kirjautumistoiminnallisuudelle. Tuli hyvät ehdotukset seuraaville riveille koodia.
- Copilot ymmärsi yllättävän hyvin suomenkielellä syötetyn ensimmäisen prompin. Tämä sisälsi projektin minimivaatimukset.
- Hyvä huomio tai lisäysehdotus AI:lta. Skippasin seuraavan muutoksen koodiin, yhtä hyvin sen olisi voinut sisällyttää:
" Added validation conditions in reservation creation: minimum 30 minutes and maximum 8 hours duration."
-

---
2. Mitä tekoäly teki huonosti?
- PROMPTIT.md dokumentointi takkuili, jouduin pyytämään usein päivittämään ja pitämään tämä ajan tasalla.
- Välillä koko kontekstia ei huomioitu kunnolla.
- AI: kaunisteli omia tekemisiään PROMPTIT.md tiedostoon. Vaikka jouduin kysymään ja pyytämään ja asioita välillä uusiksi.
-
- AI:n luomat id:t olivat alunperin incrementaalisia kunnes asensin UUID:n, ja pyysin päivittämään ne käyttämään UUID muotoon.
- Tietoturvan osalta, input validointi toistaiseksi vähäistä tai olematonta. Mikään ei tarkista vaikkapa SQL tai muun koodin syötteen varalta. Toisaalta SQL:lää ei edes ole olemassa. Esim. Pelkästään mongoosen lisääminen projektiin lisäisi jo huomattavasti taustalla "automaattisesti" tapahtuvaa validointia.
- 
- Huoneiden kapasiteettia ja sijaintia ( kerrosta ), ei ole otettu huomioon. Huoneen "modelissa", alunperin.
-
- Välillä puuhasteli omiaan kun ei tarkennetu erikseen että sovelluskehitys jatkuu edelleen. Esim: Jouduin palauttamaan userExtractorin takaisin käyttöön.
"
Why you removed userExtractor middleware? It was there for further development. For authentication and authorization.
"
-


3. Mitkä olivat tärkeimmät parannukset, jotka teit tekoälyn tuottamaan koodiin ja miksi?
- MVC, kansiorakenne ja tiedostonimissä käyttöön selkeyden vuoksi.
- UUID:n käyttöön otto. Parantaa myös tietoturvaa. Vaikeampaa arvata toisen varauksen ID. Tosin taisin tehdä tämän ennen "Ensimmäistä AI committia".
- Autentikointikoinnin ja autorizoinnin lisäys ainakin osalle toiminnallisuudesta. Huoneiden lisäys mahdollista vain kirjautuneille käyttäjille.
- Pieniä tietoturva parannuksia.
- 
- Varauksiin voisi liittä varauksen tekijän ID: ja varmistaa näin että varauksia ei voi poistaa kuin varauksen tehnyt käyttäjä. Joskin UUID auttaa jo tässä hieman.
- Bugi fixattu, userExtractoriin lisätty tarkastamaan järjestelmässä olemassa olevat käyttäjät. Tämä huomioi tilanteet jossa käyttäjä poistettu mutta tokeni on vielä voimassa. userExtractor oli "omaa" koodia.
- Lisäsin Disable 'X-Powered-By' headerin tietoturvasyistä.
- Alku- ja loppuehtojen generointi Copilotilla, näiden siirtäminen manuaalisesti route endpointtien ulkopuolelle. Paikoitellen näiden täydennys ja tarkennus.
- 

---
### Muuta analyysiä ja parannettavaa:
- Pientä epäkonsistentiutta olemassa. Id merkintöjen osalta responseissa ja modelissa. Eivät ole täysin yhteen. Pitää olla tarkkana.
Esimerkiksi: Varauksen luonti odottaa roomId:tä pyynnössä. Huone listaus array sisältää huoneet id kentällä.
- 
- git restore komennolla paluu viimeisimpään maanantai päivän committiin. Syystä: copilot sekoili huolella koodin tuottamisen ja promptit dokumentoinnin kanssa. Ei kunnolla huomioinut koko kontekstia, ja että kehitystä on tarkoitus jatkaa. Lisäksi tulkitsi model kansion sisällön oikeana modelina.

---


### Potentiaalista jatkokehitettävää ja erinäisiä huomioita:
- Myös varauksille on nyt helppo nyt lisätä autentikointi. Tällöin voisi lisätä käyttäjille roolit, varauksen voi tehdä kuka tahansa kirjautunut. Huoneet tai toisen käyttäjän vain adminit.
- 