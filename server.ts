import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Safely initialize Gemini client (User-Agent header is set for telemetry)
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } else {
    console.log("No valid GEMINI_API_KEY found, using intelligent fallback rules.");
  }
} catch (err) {
  console.error("Failed to initialize Gemini Client", err);
}

// --- API ENDPOINTS ---

// 1. GM Trade Response Generator
app.post("/api/generate-trade-commentary", async (req, res) => {
  const {
    senderTeamName,
    receiverTeamName,
    senderPlayerNames, // array
    receiverPlayerNames, // array
    gmName,
    gmPersonality,
    userProposed, // boolean: is the user proposing this?
    action // 'accept' | 'decline' | 'counter'
  } = req.body;

  const prompt = `Légy egy kosárlabda csapat vezérigazgatója (GM). A neved: ${gmName}, a személyiséged: ${gmPersonality} (greedy=kapzsi/nyerészkedő, analyst=statisztika-központú, aggressive=merész/agresszív, fair=igazságos).
A csapatod (${receiverTeamName}) éppen kapott egy csereajánlatot a következőtől: ${senderTeamName}.
Az ajánlat részletei:
- ${senderTeamName} átadná neked: ${senderPlayerNames.join(", ")}
- cserébe kérik tőled: ${receiverPlayerNames.join(", ")}

Te úgy döntöttél, hogy ezt az ajánlatot ${action === 'accept' ? 'ELFOGADOD' : 'ELUTASÍTOD'}.

Írj egy rövid, közvetlen és élethű reakciót vagy üzenetet magyar nyelven (max. 3-4 mondat), amit a másik csapat menedzserének küldesz.
Ne használj sablonos vagy mesterkélt bevezetőket, beszélj úgy, mint egy igazi profi kosárlabda menedzser. Mutasd be a személyiségedet a válaszban!`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });
      return res.json({ text: response.text?.trim() });
    } catch (err) {
      console.error("Gemini call failed for trade commentary, using fallback", err);
    }
  }

  // Fallback Rule-based generator
  let responseText = "";
  if (action === 'accept') {
    if (gmPersonality === 'greedy') {
      responseText = `Hát jól van, belemegyek ebbe az üzletbe, bár úgy érzem, óriási szívességet teszek neked. ${senderPlayerNames.join(", ")} nálunk jobb eséllyel fognak küzdeni a bajnoki címért. Küldöm a papírokat!`;
    } else if (gmPersonality === 'analyst') {
      responseText = `A statisztikai modelljeink szerint ez a csere mindkét csapat hatékonyságát növeli. ${senderPlayerNames.join(", ")} érkezése pont olyan posztokon erősít minket, ahol eddig hiányt szenvedtünk. Elfogadom az ajánlatot.`;
    } else if (gmPersonality === 'aggressive') {
      responseText = `Szeretek kockáztatni, és ez az üzlet túl izgalmas ahhoz, hogy kihagyjam! Vágjunk bele, hozassuk tető alá a cserét még ma! Legyen üdvözölve ${senderPlayerNames.join(", ")} a csapatunkban!`;
    } else {
      responseText = `Ez egy tisztességes csereajánlat, ami mindkét gárdának előnyös. Örömmel fogadom el, sok sikert kívánok nektek a szezon hátralévő részére!`;
    }
  } else {
    if (gmPersonality === 'greedy') {
      responseText = `Viczelsz velem? Ez az ajánlat teljesen komolytalan. Nem fogom eladni a sztárjaimat aprópénzért. Ha komolyan gondolod a cserét, tegyél le valami sokkal komolyabb értéket az asztalra!`;
    } else if (gmPersonality === 'analyst') {
      responseText = `Sajnálom, de az elemző szoftverünk szerint ez a tranzakció rontaná a csapatunk hatékonysági mutatóit és a fizetési sapkában sem mutat jól. Az ajánlatot elutasítjuk.`;
    } else if (gmPersonality === 'aggressive') {
      responseText = `Nem vagyok hajlandó ilyen feltételek mellett tárgyalni. Ez a csere egyáltalán nem egyezik a jövőbeli terveinkkel. Keress meg valami merészebbel, különben felejtsük el egymást!`;
    } else {
      responseText = `Köszönöm a megkeresést, de úgy gondoljuk, hogy ez a csere jelenleg nem szolgálja a csapatunk érdekeit. Megtartjuk a jelenlegi keretünket.`;
    }
  }

  return res.json({ text: responseText });
});

// 2. Sport News Match Recap Generator
app.post("/api/generate-match-recap", async (req, res) => {
  const {
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    topPlayers // array of { name, points, rebounds, assists }
  } = req.body;

  const prompt = `Írj egy izgalmas, élethű és lendületes magyar nyelvű sportújság cikket egy NBA mérkőzésről (max. 5-6 mondat).
A mérkőzés részletei:
- Hazai csapat: ${homeTeamName}
- Vendég csapat: ${awayTeamName}
- Végeredmény: ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}
- Kiemelkedő teljesítmények: ${topPlayers.map((p: any) => `${p.name} (${p.points} pont, ${p.rebounds} lepattanó, ${p.assists} gólpassz)`).join(", ")}

A cikknek tartalmaznia kell egy figyelemfelkeltő, vastag betűs sport-főcímet (címsort) az első sorban, majd alatta egy rövid, elemző és drámai összefoglalót a játékról.
A stílus legyen olyan, mint a Nemzeti Sport vagy az NBA Hungary szakértő cikkíróié.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      return res.json({ text: response.text?.trim() });
    } catch (err) {
      console.error("Gemini call failed for match recap, using fallback", err);
    }
  }

  // Fallback Rule-based generator
  const winner = homeScore > awayScore ? homeTeamName : awayTeamName;
  const loser = homeScore > awayScore ? awayTeamName : homeTeamName;
  const winnerScore = homeScore > awayScore ? homeScore : awayScore;
  const loserScore = homeScore > awayScore ? awayScore : homeScore;
  const isClose = Math.abs(homeScore - awayScore) <= 5;
  
  let headline = "";
  let body = "";

  if (isClose) {
    headline = `### **KÖRMÖKRÁGÓS FINIS: Egyetlen hajszál döntött a ${homeTeamName} - ${awayTeamName} szuperrangadón!**`;
    body = `Hihetetlen dráma bontakozott ki a parketten, ahol a végletekig kiélezett küzdelemben végül a ${winner} kerekedett felül ${winnerScore}-${loserScore} arányban. A mérkőzés hősévé a parádésan játszó sztárok váltak. A mérkőzés utolsó másodperceiben hozott feszültség igazi rájátszás hangulatot varázsolt a csarnokba, a vesztes gárda pedig büszkén távozhatott, hiszen mindent megtettek a győzelemért ezen a felejthetetlen kosárlabda estén.`;
  } else {
    headline = `### **ERŐDEMONSTRÁCIÓ: A ${winner} valóságos kosáresőt zúdított a ${loser} csapatára!**`;
    body = `A ${winner} csapata az első negyedtől kezdve magabiztosan uralta a játékot, és végül magabiztos, ${winnerScore}-${loserScore} arányú sikert aratott a ${loser} felett. A győztesek támadógépezete ellenállhatatlanul dübörgött, a védelem pedig szinte áttörhetetlen falat képezett a palánk előtt. A ${loser} edzője a meccs után elismerte, hogy ellenfelük ma osztálykülönbséggel játszott, és rengeteg tanulnivalójuk maradt a következő fordulókra.`;
  }

  const text = `${headline}\n\n${body}`;
  return res.json({ text });
});

// Setup Vite Dev Middleware / Production static delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NBA Manager server listening on http://localhost:${PORT}`);
  });
}

startServer();
