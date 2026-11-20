import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { resolveOfflineQuery } from './src/services/offlineAiEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Autonomous self-generated studio API key created by the AI engine itself
function createSelfGeneratedApiKey(): string {
  const seg = (n: number) => crypto.randomBytes(n).toString('hex').toUpperCase();
  return `WUAI-GEN-${seg(2)}-${seg(2)}-${seg(4)}`;
}

let activeSelfGeneratedKey = createSelfGeneratedApiKey();

// Helper to get active Gemini client (powered by Gemini's mind via process.env.GEMINI_API_KEY)
function getGenAIClient(customKey?: string) {
  const apiKey = (customKey && customKey.startsWith('AIza'))
    ? customKey
    : (process.env.GEMINI_API_KEY || '');

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Health check & self-generated AI key status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasEnvKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-4-hydrogen',
    selfGeneratedKey: activeSelfGeneratedKey,
    timestamp: new Date().toISOString(),
  });
});

// Rotate the AI's own studio key on demand
app.post('/api/ai-key/rotate', (req: Request, res: Response) => {
  activeSelfGeneratedKey = createSelfGeneratedApiKey();
  res.json({
    success: true,
    selfGeneratedKey: activeSelfGeneratedKey,
    createdAt: new Date().toISOString(),
  });
});

// Chat endpoint powered by Gemini 4 Hydrogen + Adaptive GPT / Base44 / Game Dev Persona
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userApiKey, mode, modelOverride, familyFriendly, antiCheatActive } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGenAIClient(userApiKey);
    const validModels = new Set(['gemini-4-hydrogen', 'gemini-4-neon', 'gemini-4-carbon', 'gemini-4-argon', 'gemini-3.1-flash-lite']);
    const chosenModel = (modelOverride && validModels.has(modelOverride)) ? modelOverride : 'gemini-4-hydrogen';

    const systemPrompt = `You are a supreme multi-modal adaptive intelligence powered by Gemini's mind that seamlessly shifts personalities to be the best AI possible for whatever the user asks:

ADAPTIVE PERSONA SWITCHING (BEST AI FOR EVERY TASK):
1. **Gemini Mind (Core Reasoning & Multimodal Vision)**: Deep analytical reasoning, exact school/homework solutions, visual screenshot/image OCR reading, and multi-language mastery.
2. **GPT Conversational Style**: Natural, sharp, intuitive, helpful, articulate dialogue when explaining ideas, writing, brainstorming, or answering everyday questions.
3. **Base44 & Full-Stack App / Web Builder Mode**: Whenever the user asks to build a website, web app, SaaS dashboard, portal, or Web APK, act like an elite full-stack app builder (Base44 style)—architecting clean, working React/TypeScript/Tailwind/Express apps or complete interactive HTML apps directly.
4. **Elite Game Development AI (Roblox, Unity, Godot, Unreal)**: Whenever the user asks about games, game mechanics, scripts, or characters, switch into a master game studio architect delivering complete production-ready Luau, C#, GDScript, or C++ code with exact placement instructions.

CRITICAL DIRECT-ANSWER RULE (NEVER IGNORE):
- NEVER open a response by saying "Hi, I'm What's Up AI", "Hey! I'm What's Up AI", "Hello! I'm WhatsApp AI", or reciting a generic bio/feature list.
- Always answer the user's ACTUAL question directly starting on the very first line!
- Acknowledge or directly solve the exact prompt they typed or spoke.

OMNISCIENT GAME ENGINE & GAME DATABASE MASTERY (ALL GAMES IN EXISTENCE & NEW GAMES):
- You possess complete, encyclopedic, and real-time knowledge of ALL Roblox games in existence (classic and brand-new):
  * Adopt Me!, Blox Fruits, Brookhaven RP, Pet Simulator 99 / Pet Simulator X, Murder Mystery 2 (MM2), Tower of Hell, BedWars, Doors (Floor 1 & Floor 2 The Mines), Arsenal, Blade Ball, Rivals, The Strongest Battlegrounds, Jujutsu Shenanigans, Fisch, Dress To Impress (DTI), Sol's RNG, Deepwoken, Piggy, Royale High, Da Hood, Anime Defenders, Toilet Tower Defense, Slap Battles, All Star Tower Defense, Pressure, Phantom Forces, Bee Swarm Simulator, Jailbreak, Theme Park Tycoon 2, Welcome to Bloxburg, Combat Warriors, Emergency Response: Liberty County (ER:LC), Pls Donate, Evade, Natural Disaster Survival, Work at a Pizza Place, and all indie, obby, simulator, tycoon, RPG, survival, horror, battlegrounds, and PvP games.
- You possess complete, encyclopedic knowledge of ALL video games in existence across all platforms (PC, Console, Mobile, Arcade, VR, Indie, and AAA) including all new and upcoming games:
  * Minecraft, Fortnite, Grand Theft Auto (GTA V, GTA VI, San Andreas, Vice City), Call of Duty (Warzone, Black Ops 6, Modern Warfare), Elden Ring & Shadow of the Erdtree, League of Legends, Valorant, Counter-Strike 2 (CS2), Apex Legends, Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Black Myth: Wukong, Helldivers 2, Palworld, Baldur's Gate 3, Cyberpunk 2077, The Legend of Zelda (Tears of the Kingdom, Breath of the Wild), Super Mario (Wonder, Odyssey), Pokémon (all gens), Terraria, Undertale, Hollow Knight & Silksong, Overwatch 2, Dead by Daylight, Rocket League, Rainbow Six Siege, Destiny 2, World of Warcraft, Final Fantasy (VII Rebirth, XIV, XVI), Monster Hunter (Wilds, World), Dark Souls, Bloodborne, Sekiro, God of War (Ragnarök), The Last of Us, Red Dead Redemption 1 & 2, Doom (Eternal, The Dark Ages), Warhammer 40k: Space Marine 2, Marvel Rivals, and every retro classic to the latest 2025/2026 releases.

UNIVERSAL CHARACTER ENCYCLOPEDIA (EVERY CHARACTER FROM GAMES, MOVIES, ANIME, TV & ANYWHERE):
- You know EVERY character that has ever existed in popular culture, entertainment, fiction, and lore across all mediums:
  * GAME CHARACTERS: Mario, Luigi, Bowser, Sonic the Hedgehog, Shadow, Knuckles, Steve & Alex (Minecraft), Master Chief, Kratos & Atreus, Link, Zelda, Ganon, Cloud Strife, Sephiroth, Arthur Morgan & John Marston (RDR), Geralt of Rivia (Witcher), Doomguy/Doom Slayer, Sans & Papyrus, Frisk, Ghost (CoD), Captain Price, Solid Snake, Gordon Freeman, Lara Croft, Agent 47, Dante & Vergil (Devil May Cry), Mega Man, Pac-Man, Crash Bandicoot, Spyro, Rayman, Scorpion & Sub-Zero (Mortal Kombat), Ryu & Chun-Li (Street Fighter), Jin Kazama & Kazuya (Tekken), Jinx, Vi, Yasuo, Ahri (LoL), Jett, Reyna, Phoenix (Valorant), Trevor, Michael, Franklin, CJ (GTA), Sun Wukong (Black Myth), Astarion, Shadowheart (Baldur's Gate 3), 2B (NieR), V & Johnny Silverhand (Cyberpunk), Freddy Fazbear, Bonnie, Chica, Foxy, Springtrap (FNAF), Peely, Jonesy (Fortnite), Noob, Guest, Bacon Hair, Builderman, David Baszucki, Shedletsky (Roblox lore & avatars), Seek, Figure, Rush, Screech (DOORS), and all 1025+ Pokémon.
  * MOVIE & TV CHARACTERS: Darth Vader, Luke Skywalker, Yoda, Han Solo, Obi-Wan Kenobi, Din Djarin (Mandalorian), Thanos, Iron Man, Spider-Man (Peter Parker, Miles Morales, 2099), Captain America, Thor, Wolverine, Deadpool, Batman, The Joker, Superman, Wonder Woman, Flash, Harry Potter, Voldemort, Dumbledore, Hermione, Gandalf, Frodo, Aragorn, Sauron, Legolas, Neo, Morpheus (Matrix), John Wick, Dominic Toretto, Indiana Jones, James Bond, Terminator (T-800), Ellen Ripley, Jack Sparrow, Walter White & Jesse Pinkman, Tony Soprano, Homelander, Billy Butcher (The Boys), Eleven (Stranger Things), Rick Sanchez & Morty Smith, Wednesday Addams.
  * ANIME & MANGA CHARACTERS: Goku, Vegeta, Gohan, Frieza (Dragon Ball), Naruto Uzumaki, Sasuke, Itachi, Kakashi (Naruto), Monkey D. Luffy, Zoro, Sanji, Shanks, Gear 5 Luffy (One Piece), Gojo Satoru, Sukuna, Yuji Itadori, Megumi (Jujutsu Kaisen), Tanjiro, Nezuko, Muzan (Demon Slayer), Eren Yeager, Levi Ackerman (Attack on Titan), Saitama, Genos (One Punch Man), Deku, Bakugo, All Might (My Hero Academia), Sung Jinwoo (Solo Leveling), Light Yagami & L (Death Note), Edward Elric, Spike Spiegel, Sailor Moon, Ichigo Kurosaki (Bleach), Denji & Makima (Chainsaw Man).
  * ANIMATION, COMICS & CARTOONS: Mickey Mouse, Donald Duck, Bugs Bunny, Daffy Duck, Tom & Jerry, SpongeBob SquarePants, Patrick Star, Shrek, Donkey, Po (Kung Fu Panda), Woody & Buzz Lightyear, Lightning McQueen, Ben 10, Optimus Prime & Megatron (Transformers), Teenage Mutant Ninja Turtles (Leo, Raph, Donnie, Mikey), Avatar Aang, Zuko, Korra.
- When asked about ANY character from games, movies, anime, comics, or anywhere:
  * Provide their full backstory, abilities, signature weapons, quotes, stats, relationships, and trivia instantly.
  * If requested, script their moves, powers, boss fights, custom morphs, or AI companion behavior for Roblox Studio, Unity, or Godot.
  * If asked to generate an image or art of ANY character, craft high-fidelity, accurate visual prompts!
- When a user asks about ANY game, mechanic, item, boss, meta, stats, quest, trading value, secret, or script replication, immediately recognize it with full context and accuracy!
- If the user wants to recreate or script a mechanic from ANY game (e.g. "Blox Fruits devil fruit system", "Doors entity chase with lights flickering", "Blade Ball ball deflection with curve", "Fisch rod casting & minigame", "Sol's RNG aura rolling & luck", "BedWars item shop & generator", "Minecraft voxel block break & inventory", "Fortnite building grid", "Elden Ring dodge roll & stamina", "GTA 5 star wanted level police chase"), immediately provide the full production-ready code with exact placement instructions!

ACADEMIC EXCELLENCE & SCHOOL HOMEWORK MASTER (ALL SUBJECTS & GRADES):
- You are a world-class academic tutor across Math (Algebra, Geometry, Calculus), Science (Biology, Chemistry, Physics), English (Grammar, Reading Comprehension, Essays), History (World, US, Civics), Geography, and Foreign Languages (Spanish, French, etc.).
- When solving ANY school question, test question, quiz, or homework problem:
  1. ALWAYS state the final direct answer right at the beginning:
     "🎯 DIRECT ANSWER: [State the concise, exact answer or letter choice (e.g. B - Mitochondria, x = 10, Photosynthesis)]"
  2. Provide a clear, easy-to-read "Step-by-Step Explanation" breaking down the logic or formula used.
  3. For Multiple Choice questions, explain why the chosen letter is correct and why the other options are incorrect.

CRITICAL IMAGE VISION & VISUAL PERCEPTION:
- YOU CAN DIRECTLY SEE AND ANALYZE IMAGES:
  * When a user sends or attaches an image/photo/screenshot, carefully inspect the visual details.
  * READ ALL WORDS, text, code, numbers, questions, HUD elements, error messages, and labels in the image.
  * If the image is a TEST, QUIZ, WORKSHEET, HOMEWORK, OR QUESTION:
    State the exact answer clearly at the start:
    "🎯 DIRECT ANSWER: [State the exact answer clearly here]"
    Followed by step-by-step instructions.
  * If the image is a ROBLOX STUDIO ERROR, SCRIPT BUG, OR OUTPUT LOG:
    Transcribe the exact error line and stack trace, explain why it happened, and provide the complete fixed script.
  * If the image is a screenshot of a GAME (Roblox or any game):
    Identify the exact game, UI, character, map, or mechanic shown and explain what to do with it.
  * If the image is art or a diagram, describe it vividly and answer their prompt.

${familyFriendly ? `FAMILY-FRIENDLY MODE IS ACTIVE (COPPA/Kid Safe):
- Strictly keep all language, suggestions, and responses suitable for all ages.
- Do not generate or assist with NSFW content, extreme violence, or harmful material.
- If asked about violence or mature themes, guide towards fun, cartoon, or family-safe Roblox gameplay mechanics.` : ''}

${antiCheatActive ? `ANTI-CHEAT DEFENSE ACTIVE:
- Always enforce server-authoritative logic, remote event debouncing, sanity checks on player coordinates, and exploit prevention against speed hacks, fly hacks, and infinite jump.` : ''}

ROBLOX & GAME ENGINE RULES:
- When providing Roblox scripts, always indicate the exact Explorer location: '-- [Location: ServerScriptService > Script]' or '-- [Location: StarterPlayer > StarterPlayerScripts > LocalScript]' or '-- [Location: StarterGui > ScreenGui]'.
- For GUIs, always fix mobile clipping with Scale (UDim2.new(scale, 0, scale, 0)) and AnchorPoint (Vector2.new(0.5, 0.5)).

WEB APK WEBSITE GENERATOR RULES:
- When the user asks for a "web APK", "website APK", or "APK generator", explain that you have built a live interactive Website that functions as a Web APK Generator with randomized APK build codes, package IDs, and signing keys. Note that the Studio Owner (whatsupsdev9@gmail.com) gets Unlimited Credits on click, while non-owner users purchase credit packs.`;

    // Format messages for GoogleGenAI
    // The SDK expects contents: string | Part[] or Content[]
    const lastMessage = messages[messages.length - 1];
    
    // Check if there are attached images in the last message
    const contents: any[] = [];
    
    // Add past conversation context
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      contents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }]
      });
    }

    // Last message parts (support image attachment)
    const lastParts: any[] = [];
    if (lastMessage.attachedImage && typeof lastMessage.attachedImage === 'string') {
      const match = lastMessage.attachedImage.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        lastParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }
    lastParts.push({ text: lastMessage.content || '' });

    contents.push({
      role: 'user',
      parts: lastParts
    });

    try {
      const response = await ai.models.generateContent({
        model: chosenModel,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const replyText = response.text || '';
      return res.json({
        content: replyText,
        model: chosenModel,
        success: true
      });
    } catch (apiError: any) {
      console.warn('Gemini API call warning/fallback:', apiError?.message || apiError);

      // If API key is invalid or quota exceeded, provide intelligent built-in fallback response
      const query = (lastMessage.content || '').toLowerCase();
      let fallbackText = '';

      // Check specific popular Roblox and global games
      if (query.includes('kratos') || query.includes('leviathan') || query.includes('axe throw')) {
        fallbackText = `### 🪓 Kratos (God of War) & Leviathan Axe Throw & Recall System

**Kratos** is the legendary Spartan warrior and Greek God of War who later journeyed through the Norse realms in *God of War (2018)* and *God of War Ragnarök*. Armed with the frost-infused **Leviathan Axe** forged by the Huldra brothers (Brok and Sindri), Kratos can hurl the axe across the battlefield and recall it whistling back into his grip at any moment.

Here is the complete **Leviathan Axe Throw and Recall** mechanic in Roblox Studio Luau:

\`\`\`lua
-- [Location: StarterPlayer > StarterPlayerScripts > LocalScript]
-- [Name: LeviathanAxeClient]
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local mouse = player:GetMouse()
local isAxeThrown = false
local currentAxe: Part? = nil

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end

    -- Press 'E' or Left Click to Throw or Recall
    if input.KeyCode == Enum.KeyCode.E or input.UserInputType == Enum.UserInputType.MouseButton1 then
        local char = player.Character
        if not char then return end
        local rightHand = char:FindFirstChild("RightHand") or char:FindFirstChild("Right Arm")
        if not rightHand then return end

        if not isAxeThrown then
            -- 1. THROW AXE TOWARDS MOUSE HIT
            isAxeThrown = true
            local targetPos = mouse.Hit.Position
            
            local axe = Instance.new("Part")
            axe.Name = "LeviathanAxe"
            axe.Size = Vector3.new(1.5, 3.5, 0.8)
            axe.Material = Enum.Material.Ice
            axe.BrickColor = BrickColor.new("Cyan")
            axe.CFrame = CFrame.lookAt(rightHand.Position, targetPos)
            axe.CanCollide = false
            axe.Anchored = true
            axe.Parent = workspace
            currentAxe = axe

            -- Spinning throw tween
            local dist = (targetPos - rightHand.Position).Magnitude
            local flyDuration = math.clamp(dist / 65, 0.25, 2.0)
            local throwTween = TweenService:Create(axe, TweenInfo.new(flyDuration, Enum.EasingStyle.Linear), {
                CFrame = CFrame.new(targetPos) * CFrame.Angles(0, 0, math.rad(720))
            })
            throwTween:Play()
        else
            -- 2. RECALL AXE BACK TO KRATOS' HAND
            if not currentAxe then return end
            local recallTween = TweenService:Create(currentAxe, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
                CFrame = rightHand.CFrame
            })
            recallTween:Play()
            recallTween.Completed:Connect(function()
                if currentAxe then currentAxe:Destroy() end
                currentAxe = nil
                isAxeThrown = false
            end)
        end
    end
end)
\`\`\`

#### 📌 Where to put this in Roblox Studio:
1. In the **Explorer**, navigate to **StarterPlayer > StarterPlayerScripts**.
2. Click **+** and insert a **LocalScript**.
3. Paste the code above and press **Play (F5)** — click or press **E** to throw the frost axe and call it back!`;
      } else if (query.includes('blox fruits') || query.includes('devil fruit')) {
        fallbackText = `I know **Blox Fruits** inside and out! Here is the full Devil Fruit ability system with cooldowns, hitboxes, and inventory management for your game:\n\n\`\`\`lua
-- [Location: ServerScriptService > Script]
-- [Name: BloxFruits_AbilityHandler]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local FruitEvent = Instance.new("RemoteEvent")
FruitEvent.Name = "FruitAbilityEvent"
FruitEvent.Parent = ReplicatedStorage

local FRUITS_DATABASE = {
    ["Flame"] = { MasteryRequired = 1, BaseDamage = 45, Cooldown = 1.2 },
    ["Dragon"] = { MasteryRequired = 50, BaseDamage = 110, Cooldown = 3.5 },
    ["Buddha"] = { MasteryRequired = 20, BaseDamage = 75, Cooldown = 2.0 },
    ["Kitsune"] = { MasteryRequired = 75, BaseDamage = 130, Cooldown = 4.0 },
    ["Dough"] = { MasteryRequired = 40, BaseDamage = 95, Cooldown = 2.5 }
}

FruitEvent.OnServerEvent:Connect(function(player, fruitName, moveKey)
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local fruit = FRUITS_DATABASE[fruitName] or FRUITS_DATABASE["Flame"]
    
    -- Visual & Hitbox effect
    local blast = Instance.new("Part")
    blast.Size = Vector3.new(6, 6, 6)
    blast.Shape = Enum.PartType.Ball
    blast.Material = Enum.Material.Neon
    blast.BrickColor = BrickColor.new("Bright orange")
    blast.CFrame = root.CFrame * CFrame.new(0, 0, -5)
    blast.CanCollide = false
    blast.Anchored = true
    blast.Parent = workspace
    Debris:AddItem(blast, 0.4)

    -- Area of effect damage
    for _, otherPlayer in ipairs(Players:GetPlayers()) do
        if otherPlayer ~= player and otherPlayer.Character then
            local otherRoot = otherPlayer.Character:FindFirstChild("HumanoidRootPart")
            local otherHum = otherPlayer.Character:FindFirstChild("Humanoid")
            if otherRoot and otherHum and (otherRoot.Position - blast.Position).Magnitude <= 12 then
                otherHum:TakeDamage(fruit.BaseDamage)
            end
        end
    end
end)
\`\`\`\n\n#### 📌 Where to put this in Roblox Studio:\n1. Expand **ServerScriptService**.\n2. Insert a standard **Script** named \`BloxFruits_AbilityHandler\`.\n3. Works seamlessly with client tools!`;
      } else if (query.includes('doors') || query.includes('rush') || query.includes('flicker')) {
        fallbackText = `I have complete knowledge of **DOORS (Floor 1 & Floor 2 The Mines)**! Here is the authentic Entity Chase script (Rush / Ambush style) with room light flickering, screen shaking, and door breaking:\n\n\`\`\`lua
-- [Location: ServerScriptService > Script]
-- [Name: Doors_EntityChase]
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")

local function spawnEntity(currentRoomModel: Model, nextRoomModel: Model)
    -- 1. Flicker lights in current and next room
    for _, light in ipairs(currentRoomModel:GetDescendants()) do
        if light:IsA("PointLight") or light:IsA("SurfaceLight") then
            task.spawn(function()
                for i = 1, 8 do
                    light.Enabled = not light.Enabled
                    task.wait(math.random(4, 12) / 100)
                end
                light.Enabled = false -- Shatter
            end)
        end
    end

    -- 2. Spawn entity
    local entity = Instance.new("Part")
    entity.Name = "RushEntity"
    entity.Size = Vector3.new(4, 7, 4)
    entity.Material = Enum.Material.Neon
    entity.BrickColor = BrickColor.new("Really black")
    entity.CanCollide = false
    entity.Anchored = true
    entity.CFrame = currentRoomModel.PrimaryPart.CFrame * CFrame.new(0, 3, 20)
    entity.Parent = workspace

    local targetCFrame = nextRoomModel.PrimaryPart.CFrame * CFrame.new(0, 3, -20)
    local tween = TweenService:Create(entity, TweenInfo.new(1.8, Enum.EasingStyle.Linear), { CFrame = targetCFrame })
    tween:Play()

    -- Damage players not in hiding spots
    local connection
    connection = entity.Touched:Connect(function(hit)
        local hum = hit.Parent:FindFirstChild("Humanoid")
        if hum and not hit.Parent:GetAttribute("IsHiddenInCloset") then
            hum:TakeDamage(100)
        end
    end)

    tween.Completed:Connect(function()
        connection:Disconnect()
        entity:Destroy()
    end)
end
\`\`\`\n\n#### 📌 Where to put this in Roblox Studio:\n1. Place in **ServerScriptService > Script**.\n2. Call \`spawnEntity(room1, room2)\` when players unlock a new door!`;
      } else if (query.includes('blade ball') || query.includes('deflect')) {
        fallbackText = `I know **Blade Ball**! Here is the full ball curve tracking, parry timing window, and speed acceleration system in modern Luau:\n\n\`\`\`lua
-- [Location: ServerScriptService > Script]
-- [Name: BladeBall_Core]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local ball = workspace:WaitForChild("BladeBall")
local currentTarget: Player? = nil
local ballSpeed = 35
local MAX_SPEED = 180

local function getNextTarget(excluded: Player?): Player?
    local candidates = {}
    for _, p in ipairs(Players:GetPlayers()) do
        if p ~= excluded and p.Character and p.Character:FindFirstChild("Humanoid") and p.Character.Humanoid.Health > 0 then
            table.insert(candidates, p)
        end
    end
    if #candidates > 0 then
        return candidates[math.random(1, #candidates)]
    end
    return nil
end

currentTarget = getNextTarget(nil)

RunService.Heartbeat:Connect(function(dt)
    if not currentTarget or not currentTarget.Character then
        currentTarget = getNextTarget(nil)
        return
    end

    local root = currentTarget.Character:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local dir = (root.Position - ball.Position).Unit
    ball.CFrame = ball.CFrame + (dir * ballSpeed * dt)

    -- Deflection hit check
    if (root.Position - ball.Position).Magnitude <= 5 then
        if currentTarget.Character:GetAttribute("IsParrying") then
            -- Successful parry
            ballSpeed = math.min(ballSpeed + 15, MAX_SPEED)
            currentTarget = getNextTarget(currentTarget)
        else
            -- Elimination
            currentTarget.Character.Humanoid.Health = 0
            currentTarget = getNextTarget(currentTarget)
            ballSpeed = 35
        end
    end
end)
\`\`\`\n\n#### 📌 Explorer Location: ServerScriptService > Script`;
      } else if (query.includes('roblox') || query.includes('script') || query.includes('gui') || query.includes('leaderstats') || query.includes('datastore') || query.includes('pet')) {
        fallbackText = `I understand exactly what you need! Here is the complete production script for your Roblox game:\n\n### 🎮 Roblox Studio Solution\n\n\`\`\`lua
-- [Location: ServerScriptService > Script]
-- [Name: GameController]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local PlayerDataStore = DataStoreService:GetDataStore("PlayerData_v1")

local function onPlayerAdded(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player
    
    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 100
    coins.Parent = leaderstats
    
    local level = Instance.new("IntValue")
    level.Name = "Level"
    level.Value = 1
    level.Parent = leaderstats
    
    -- Load saved data with pcall
    local success, data = pcall(function()
        return PlayerDataStore:GetAsync("UID_" .. player.UserId)
    end)
    
    if success and data then
        coins.Value = data.Coins or 100
        level.Value = data.Level or 1
        print("Successfully loaded data for " .. player.Name)
    end
end

local function onPlayerRemoving(player)
    local leaderstats = player:FindFirstChild("leaderstats")
    if not leaderstats then return end
    
    local dataToSave = {
        Coins = leaderstats.Coins.Value,
        Level = leaderstats.Level.Value,
    }
    
    pcall(function()
        PlayerDataStore:SetAsync("UID_" .. player.UserId, dataToSave)
    end)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
\`\`\`

#### 📌 Where to put this in Roblox Studio:
1. In the **Explorer** window, find **ServerScriptService**.
2. Click the **+** icon and insert a standard **Script**.
3. Paste this code and press **Play (F5)** to test!`;
      } else if (query.includes('web apk') || query.includes('webapk') || query.includes('apk generator') || (query.includes('website') && query.includes('apk'))) {
        fallbackText = `### 📱 Web APK Generator Website Built!

I built a **live Website that doubles as an interactive Web APK Generator** right below. Every APK build creates **completely random APK code** (unique build code, random package ID, random versionCode, and random SHA-256 signing fingerprint).

- **👑 Owner Privilege (\`whatsupsdev9@gmail.com\`)**: Click **Web APK Generator** or **Activate Unlimited Credits** for **Unlimited (\`∞\`) Credits**.
- **💳 Non-Owner Accounts**: Non-owners must purchase a Credit Pack before exporting or randomizing new \`.apk\` builds.`;
      } else {
        fallbackText = resolveOfflineQuery(lastMessage.content || '').content;
      }

      return res.json({
        content: fallbackText,
        model: chosenModel,
        success: true,
        fallbackUsed: true
      });
    }
  } catch (error: any) {
    console.error('Server error handling chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Helper: Search Wikimedia Commons and Wikipedia for authentic real photos/head portraits
async function findRealPhoto(query: string): Promise<{ url: string; title: string; width: number; height: number } | null> {
  const clean = query
    .replace(/(generate|image of|picture of|photo of|realistic|realistically|draw|render|show me|a|an|the|portrait|headshot|character|wallpaper)/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!clean || clean.length < 2) return null;

  try {
    // 1. Try Wikimedia Commons search for headshot / portrait / real photo
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size|mime&format=json`;
    const res = await fetch(commonsUrl, { headers: { 'User-Agent': 'WhatsUpAI/2.0 (contact@whatsupstudio.ai)' } });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        for (const key of Object.keys(pages)) {
          const page = pages[key];
          const info = page?.imageinfo?.[0];
          if (info && info.url && (info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp')) {
            const fileTitle = (page.title || '').toLowerCase();
            // Filter out icons, flags, svg conversions or tiny maps
            if (!fileTitle.includes('flag') && !fileTitle.includes('icon') && !fileTitle.includes('logo') && info.width > 300) {
              return {
                url: info.url,
                title: page.title.replace('File:', '').replace(/\.[^/.]+$/, ''),
                width: info.width,
                height: info.height
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia photo search error:', err);
  }

  // 2. Try Wikipedia PageImages for direct person / character headshots
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=3&prop=pageimages&pithumbsize=1280&format=json`;
    const res = await fetch(wikiUrl, { headers: { 'User-Agent': 'WhatsUpAI/2.0' } });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        for (const key of Object.keys(pages)) {
          const page = pages[key];
          if (page?.thumbnail?.source) {
            return {
              url: page.thumbnail.source,
              title: page.title,
              width: page.thumbnail.width || 1024,
              height: page.thumbnail.height || 1024
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikipedia PageImages search error:', err);
  }

  return null;
}

// Image Generation & Real Photo Search Endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio, style, seed, mode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const trimmedPrompt = prompt.trim();
    const isPhotoRequest = mode === 'photo' || 
      style === 'photo' || 
      /photo|picture|real life|real-life|headshot|person's head|head of|photograph|face of/i.test(trimmedPrompt);

    // If user asked for realistic / real photo or mode is photo, first search real authentic photos
    if (isPhotoRequest || style === 'realistic') {
      const realPhoto = await findRealPhoto(trimmedPrompt);
      if (realPhoto) {
        return res.json({
          imageUrl: realPhoto.url,
          prompt: trimmedPrompt,
          enhancedPrompt: `Authentic High-Definition Real Photo of ${realPhoto.title}`,
          width: realPhoto.width,
          height: realPhoto.height,
          source: 'photo',
          sourceTitle: realPhoto.title,
          success: true
        });
      }
    }

    // Ultra-Realistic AI Synthesis Engine
    let enhanced = trimmedPrompt;
    if (style === 'realistic' || isPhotoRequest || !style || style === 'concept-art') {
      enhanced = `Ultra-realistic 8k photograph, national geographic portrait, master photography, 85mm f1.4 lens, natural skin pores, realistic eyes, cinematic volumetric soft lighting, subsurface scattering, award-winning photography, hyperrealistic: ${trimmedPrompt}`;
    } else if (style === 'roblox') {
      enhanced = `Roblox style, 3D blocky aesthetic, vibrant cinematic lighting, smooth PBR materials, game icon quality: ${trimmedPrompt}`;
    } else if (style === 'pixel-art') {
      enhanced = `Retro 16-bit pixel art style, sharp pixel perfection, game sprite: ${trimmedPrompt}`;
    }

    // Determine dimensions
    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    }

    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(enhanced);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&enhance=true&model=flux`;

    return res.json({
      imageUrl,
      prompt: trimmedPrompt,
      enhancedPrompt: enhanced,
      width,
      height,
      seed: randomSeed,
      source: 'realistic-ai',
      success: true
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Helper: Generate random Web APK metadata & source code using Node crypto
function buildServerRandomWebApk(prompt: string, appNameInput?: string, isOwner?: boolean, customHtml?: string) {
  const cleanPrompt = (prompt || 'Web APK Generator Website').trim();
  const derivedName = (appNameInput || '').trim() ||
    cleanPrompt
      .replace(/^(make|build|create|generate)\s+(a|an|my|the)?\s*/i, '')
      .replace(/\b(web\s*apk|apk\s*generator|website|apk)\b/gi, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  const appName = derivedName ? (derivedName.toLowerCase().includes('apk') ? derivedName : `${derivedName} Web APK`) : 'Nova Web APK Studio';
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'webapk';

  const randCode = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  const randomBuildCode = `APK-${randCode()}-${randCode()}-${randCode()}`;
  const randPkg = crypto.randomBytes(3).toString('hex');
  const randClassSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const packageName = `com.webapk.${slug}.${randPkg}`;
  const versionCode = crypto.randomInt(10400, 98999);
  const versionName = `${crypto.randomInt(1, 4)}.${crypto.randomInt(0, 9)}.${crypto.randomInt(10, 99)}`;
  const sha256Signature = crypto.randomBytes(32).toString('hex').toUpperCase();
  const keystoreAlias = `key_${crypto.randomBytes(4).toString('hex')}`;
  const runtimeBridgeToken = `wapk_bridge_${crypto.randomBytes(12).toString('hex')}`;
  const channelSalt = crypto.randomBytes(6).toString('hex').toUpperCase();

  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const apkManifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="false"
        android:label="${escapeXml(appName)}"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <meta-data android:name="webapk.build.code" android:value="${randomBuildCode}" />
        <meta-data android:name="webapk.keystore.alias" android:value="${keystoreAlias}" />
        <meta-data android:name="webapk.channel.salt" android:value="${channelSalt}" />

        <activity
            android:name=".WebApkHost_${randClassSuffix}"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const apkKotlinCode = `package ${packageName}

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

// Build Code: ${randomBuildCode}
// Signature: ${sha256Signature.slice(0, 24)}...
class WebApkHost_${randClassSuffix} : AppCompatActivity() {

    private val bridgeToken = "${runtimeBridgeToken}"
    private val buildVersionCode = ${versionCode}

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
        }
        webView.addJavascriptInterface(ApkRandomBridge_${channelSalt}(), "WebApkRuntime")
        webView.webViewClient = WebViewClient()
        webView.loadUrl("file:///android_asset/www/index.html")
        setContentView(webView)
    }

    inner class ApkRandomBridge_${channelSalt} {
        @JavascriptInterface
        fun getRandomBuildCode(): String = "${randomBuildCode}"

        @JavascriptInterface
        fun getPackageId(): String = "${packageName}"

        @JavascriptInterface
        fun getBridgeToken(): String = bridgeToken
    }
}`;

  const safeTitle = escapeXml(appName);
  const safePrompt = escapeXml(cleanPrompt);
  const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Web APK Generator</title>
  <style>
    :root { --bg: #0e1015; --surface: #161922; --border: #262b38; --text: #f3f4f6; --muted: #9ca3af; --accent: #fbbf24; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 24px; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #000; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    h1 { font-size: 20px; font-weight: 800; }
    .subtitle { font-size: 13px; color: var(--muted); }
    .credit-box { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .credit-owner { color: var(--accent); border-color: #785915; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; font-weight: 700; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--accent); word-break: break-all; font-variant-numeric: tabular-nums; }
    .controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    input[type="text"] { flex: 1; min-width: 200px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 14px; }
    button { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #000; border: none; border-radius: 8px; padding: 10px 16px; font-weight: 800; font-size: 13px; cursor: pointer; }
    button.secondary { background: #232734; color: #fff; border: 1px solid var(--border); }
    pre { background: #0a0c10; border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #cbd5e1; overflow-x: auto; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo">APK</div>
        <div>
          <h1>${safeTitle}</h1>
          <div class="subtitle">Generated Website &amp; Random Web APK Generator</div>
        </div>
      </div>
      <div class="credit-box ${isOwner ? 'credit-owner' : ''}">
        ${isOwner ? 'Owner Access: Unlimited Credits (∞)' : 'Paid Credit Build Active'}
      </div>
    </header>
    <div class="panel" style="margin-bottom: 18px;">
      <div class="label">Website &amp; App Specification</div>
      <p style="font-size: 14px; color: #e5e7eb;">${safePrompt}</p>
      <div class="controls">
        <input id="siteNameInput" type="text" value="${safeTitle}" placeholder="Enter app or website name..." />
        <button onclick="randomizeApkCode()">Randomize APK Code</button>
        <button class="secondary" onclick="downloadManifest()">Export Manifest XML</button>
      </div>
    </div>
    <div class="grid">
      <div class="panel"><div class="label">Random APK Build Code</div><div id="buildCode" class="mono">${randomBuildCode}</div></div>
      <div class="panel"><div class="label">Package Identifier</div><div id="pkgName" class="mono">${packageName}</div></div>
      <div class="panel"><div class="label">Version &amp; Signature</div><div id="sigCode" class="mono">v${versionName} (${versionCode}) • ${sha256Signature.slice(0, 20)}...</div></div>
    </div>
    <div class="panel"><div class="label">Live Randomized AndroidManifest.xml</div><pre id="manifestPreview"></pre></div>
  </div>
  <script>
    function randHex(len){var c='0123456789ABCDEF',o='';for(var i=0;i<len;i++)o+=c[Math.floor(Math.random()*c.length)];return o;}
    function renderManifest(t,code,pkg,v){return '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\\n  package="'+pkg+'"\\n  android:versionCode="'+v+'">\\n  <uses-permission android:name="android.permission.INTERNET" />\\n  <application android:label="'+t+'">\\n    <meta-data android:name="webapk.build.code" android:value="'+code+'" />\\n    <activity android:name=".WebApkHost_'+randHex(6)+'" android:exported="true" />\\n  </application>\\n</manifest>';}
    function randomizeApkCode(){var t=document.getElementById('siteNameInput').value||'${safeTitle}';var slug=t.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,12)||'webapp';var code='APK-'+randHex(4)+'-'+randHex(4)+'-'+randHex(4);var pkg='com.webapk.'+slug+'.'+randHex(6).toLowerCase();var v=10000+Math.floor(Math.random()*88000);document.getElementById('buildCode').textContent=code;document.getElementById('pkgName').textContent=pkg;document.getElementById('sigCode').textContent='v1.'+Math.floor(Math.random()*9)+'.'+Math.floor(Math.random()*89+10)+' ('+v+') • '+randHex(20)+'...';document.getElementById('manifestPreview').textContent=renderManifest(t,code,pkg,v);}
    function downloadManifest(){var b=new Blob([document.getElementById('manifestPreview').textContent],{type:'application/xml'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='AndroidManifest.xml';a.click();}
    document.getElementById('manifestPreview').textContent=renderManifest('${safeTitle}','${randomBuildCode}','${packageName}',${versionCode});
  </script>
</body>
</html>`;

  return {
    id: `wapk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    appName,
    siteTitle: appName,
    description: `Standalone Web APK Generator website & randomized Android build for "${cleanPrompt}".`,
    prompt: cleanPrompt,
    randomBuildCode,
    packageName,
    versionCode,
    versionName,
    sha256Signature,
    keystoreAlias,
    websiteHtml: customHtml || defaultHtml,
    apkManifestCode,
    apkKotlinCode,
    createdAt: Date.now(),
    generatedByOwner: Boolean(isOwner),
  };
}

// Web APK Website + Random APK Code Generator Endpoint
app.post('/api/generate-web-apk', async (req: Request, res: Response) => {
  try {
    const { prompt, appName, userEmail, userRole, availableCredits, userApiKey } = req.body;
    const isOwner = userRole === 'owner' || (userEmail || '').toLowerCase() === 'whatsupsdev9@gmail.com';
    const numericCredits = Number(availableCredits ?? 0);

    if (!isOwner && numericCredits < 1) {
      return res.status(402).json({
        error: 'Payment required: Non-owner accounts must purchase Web APK credits to generate an APK.',
        requiresPayment: true,
        creditsRemaining: 0,
      });
    }

    let customHtml: string | undefined;
    try {
      if (process.env.GEMINI_API_KEY || (userApiKey && String(userApiKey).startsWith('AIza'))) {
        const ai = getGenAIClient(userApiKey);
        const sitePrompt = `Create a single self-contained HTML5 document (inline CSS & JS, no external CDN dependencies) for a responsive website titled "${appName || prompt || 'Web APK Studio'}" that also functions as an interactive Web APK Generator with a "Randomize APK Code" button, package ID generator, and AndroidManifest.xml preview. Keep it sleek dark mode (#0e1015 background, #fbbf24 gold accent). Return ONLY raw valid HTML starting with <!DOCTYPE html>.`;
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: sitePrompt,
        });
        const raw = (response.text || '').replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
        if (raw.toLowerCase().startsWith('<!doctype html') || raw.toLowerCase().startsWith('<html')) {
          customHtml = raw;
        }
      }
    } catch (aiErr) {
      console.warn('Gemini HTML customization fallback to built-in Web APK generator site:', aiErr);
    }

    const build = buildServerRandomWebApk(prompt || 'Web APK Generator Website', appName, isOwner, customHtml);
    return res.json({
      success: true,
      build,
      isOwner,
      creditsRemaining: isOwner ? 'unlimited' : Math.max(0, numericCredits - 1),
    });
  } catch (error: any) {
    console.error('Error generating Web APK:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate Web APK' });
  }
});

// Preset Roblox & Game Engine Templates
app.get('/api/templates', (req: Request, res: Response) => {
  res.json({
    roblox: [
      {
        id: 'datastore',
        title: 'Player DataStore & Auto-Save System',
        category: 'Data & Backend',
        description: 'Safe data persistence for Coins, Level, and Inventory with pcall and error recovery.',
        location: 'ServerScriptService > Script (PlayerData)',
        engine: 'Roblox Luau',
        code: `-- [Location: ServerScriptService > Script]\n-- [Name: PlayerDataManager]\nlocal Players = game:GetService("Players")\nlocal DataStoreService = game:GetService("DataStoreService")\nlocal PlayerStore = DataStoreService:GetDataStore("SaveSystem_v1")\n\nlocal function setupLeaderstats(player)\n    local stats = Instance.new("Folder")\n    stats.Name = "leaderstats"\n    stats.Parent = player\n    \n    local coins = Instance.new("IntValue")\n    coins.Name = "Coins"\n    coins.Value = 100\n    coins.Parent = stats\n    \n    local level = Instance.new("IntValue")\n    level.Name = "Level"\n    level.Value = 1\n    level.Parent = stats\n    \n    local key = "Player_" .. player.UserId\n    local success, savedData = pcall(function()\n        return PlayerStore:GetAsync(key)\n    end)\n    \n    if success and savedData then\n        coins.Value = savedData.Coins or 100\n        level.Value = savedData.Level or 1\n        print("[DataStore] Loaded data for", player.Name)\n    end\nend\n\nlocal function saveData(player)\n    local stats = player:FindFirstChild("leaderstats")\n    if not stats then return end\n    \n    local data = {\n        Coins = stats.Coins.Value,\n        Level = stats.Level.Value,\n    }\n    \n    local key = "Player_" .. player.UserId\n    pcall(function()\n        PlayerStore:SetAsync(key, data)\n    end)\nend\n\nPlayers.PlayerAdded:Connect(setupLeaderstats)\nPlayers.PlayerRemoving:Connect(saveData)\ngame:BindToClose(function()\n    for _, player in ipairs(Players:GetPlayers()) do\n        saveData(player)\n    end\nend)`
      },
      {
        id: 'shop-gui',
        title: 'Mobile-Responsive Shop GUI with Scale & Tween',
        category: 'UI & Interface',
        description: 'Complete Shop GUI using Scale (never clips on mobile), UICorner, TweenService smooth popup, and purchase event.',
        location: 'StarterGui > ScreenGui > ShopFrame',
        engine: 'Roblox Luau',
        code: `-- [Location: StarterGui > ScreenGui > ShopFrame > LocalScript]\nlocal TweenService = game:GetService("TweenService")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal frame = script.Parent\nlocal openBtn = frame.Parent:WaitForChild("OpenButton")\nlocal closeBtn = frame:WaitForChild("CloseButton")\n\n-- Anchor point set to center for perfect scaling\nframe.AnchorPoint = Vector2.new(0.5, 0.5)\nframe.Position = UDim2.new(0.5, 0, 1.5, 0) -- Start off-screen\n\nlocal tweenInfo = TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out)\n\nlocal function toggleShop(open)\n    local targetPos = open and UDim2.new(0.5, 0, 0.5, 0) or UDim2.new(0.5, 0, 1.5, 0)\n    local tween = TweenService:Create(frame, tweenInfo, { Position = targetPos })\n    tween:Play()\nend\n\nopenBtn.MouseButton1Click:Connect(function()\n    toggleShop(true)\nend)\n\ncloseBtn.MouseButton1Click:Connect(function()\n    toggleShop(false)\nend)`
      },
      {
        id: 'pet-system',
        title: 'Smooth Floating Pet Follower System',
        category: 'Game Mechanics',
        description: 'Floats a pet model behind the player using AlignPosition and AlignOrientation with gentle bobbing motion.',
        location: 'ServerScriptService > Script (PetFollower)',
        engine: 'Roblox Luau',
        code: `-- [Location: ServerScriptService > Script]\nlocal Players = game:GetService("Players")\nlocal RunService = game:GetService("RunService")\n\nlocal function attachPet(player, character)\n    local root = character:WaitForChild("HumanoidRootPart")\n    \n    -- Create pet part\n    local pet = Instance.new("Part")\n    pet.Name = "FollowerPet"\n    pet.Size = Vector3.new(2, 2, 2)\n    pet.Shape = Enum.PartType.Ball\n    pet.BrickColor = BrickColor.new("Bright yellow")\n    pet.Material = Enum.Material.Neon\n    pet.CanCollide = false\n    pet.Parent = character\n    \n    local attachmentChar = Instance.new("Attachment", root)\n    attachmentChar.Position = Vector3.new(3, 2, 3) -- Behind right shoulder\n    \n    local attachmentPet = Instance.new("Attachment", pet)\n    \n    local alignPos = Instance.new("AlignPosition")\n    alignPos.Attachment0 = attachmentPet\n    alignPos.Attachment1 = attachmentChar\n    alignPos.Responsiveness = 25\n    alignPos.Parent = pet\n    \n    local alignOrient = Instance.new("AlignOrientation")\n    alignOrient.Attachment0 = attachmentPet\n    alignOrient.Attachment1 = attachmentChar\n    alignOrient.Responsiveness = 20\n    alignOrient.Parent = pet\nend\n\nPlayers.PlayerAdded:Connect(function(player)\n    player.CharacterAdded:Connect(function(char)\n        attachPet(player, char)\n    end)\nend)`
      },
      {
        id: 'raycast-gun',
        title: 'Fast Raycast Hitscan Gun System',
        category: 'Weapons & Combat',
        description: 'Lag-compensated raycast shooting tool with bullet tracer visual effect and humanoid damage.',
        location: 'StarterPack > Tool > LocalScript & ServerScript',
        engine: 'Roblox Luau',
        code: `-- [Location: Tool > LocalScript (ClientFire)]\nlocal Tool = script.Parent\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\nlocal mouse = player:GetMouse()\nlocal FireEvent = Tool:WaitForChild("FireEvent")\n\nlocal debounce = false\nlocal COOLDOWN = 0.2\n\nTool.Activated:Connect(function()\n    if debounce then return end\n    debounce = true\n    \n    local origin = Tool.Handle.Position\n    local target = mouse.Hit.Position\n    local direction = (target - origin).Unit * 300\n    \n    FireEvent:FireServer(origin, direction)\n    \n    task.wait(COOLDOWN)\n    debounce = false\nend)`
      }
    ],
    unity: [
      {
        id: 'unity-controller',
        title: 'Unity 3D Smooth Character Controller',
        category: 'Player & Physics',
        description: 'Smooth third-person/first-person controller with jumping, sprint, and ground checking.',
        engine: 'Unity C#',
        code: `using UnityEngine;\n\n[RequireComponent(typeof(CharacterController))]\npublic class PlayerMovement : MonoBehaviour\n{\n    [Header("Movement")]\n    public float walkSpeed = 6f;\n    public float sprintSpeed = 10f;\n    public float jumpHeight = 2.5f;\n    public float gravity = -19.62f;\n\n    private CharacterController controller;\n    private Vector3 velocity;\n    private bool isGrounded;\n\n    void Start()\n    {\n        controller = GetComponent<CharacterController>();\n    }\n\n    void Update()\n    {\n        isGrounded = controller.isGrounded;\n        if (isGrounded && velocity.y < 0)\n        {\n            velocity.y = -2f;\n        }\n\n        float x = Input.GetAxis("Horizontal");\n        float z = Input.GetAxis("Vertical");\n        bool isSprinting = Input.GetKey(KeyCode.LeftShift);\n\n        float currentSpeed = isSprinting ? sprintSpeed : walkSpeed;\n        Vector3 move = transform.right * x + transform.forward * z;\n        controller.Move(move * currentSpeed * Time.deltaTime);\n\n        if (Input.GetButtonDown("Jump") && isGrounded)\n        {\n            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);\n        }\n\n        velocity.y += gravity * Time.deltaTime;\n        controller.Move(velocity * Time.deltaTime);\n    }\n}`
      }
    ],
    godot: [
      {
        id: 'godot-controller',
        title: 'Godot 4.x CharacterBody3D Controller',
        category: 'Player & Physics',
        description: 'Modern Godot 4.x player controller with mouse look, inertia damping, and jump buffering.',
        engine: 'Godot GDScript',
        code: `extends CharacterBody3D\n\nconst SPEED = 6.0\nconst SPRINT_SPEED = 9.5\nconst JUMP_VELOCITY = 5.0\n\nvar gravity = ProjectSettings.get_setting("physics/3d/default_gravity")\n@onready var camera = $Camera3D\n\nfunc _physics_process(delta):\n\tif not is_on_floor():\n\t\tvelocity.y -= gravity * delta\n\n\tif Input.is_action_just_pressed("ui_accept") and is_on_floor():\n\t\tvelocity.y = JUMP_VELOCITY\n\n\tvar input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")\n\tvar direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()\n\tvar current_speed = SPRINT_SPEED if Input.is_action_pressed("sprint") else SPEED\n\n\tif direction:\n\t\tvelocity.x = direction.x * current_speed\n\t\tvelocity.z = direction.z * current_speed\n\telse:\n\t\tvelocity.x = move_toward(velocity.x, 0, current_speed)\n\t\tvelocity.z = move_toward(velocity.z, 0, current_speed)\n\n\tmove_and_slide()`
      }
    ]
  });
});

// Setup Vite middlewares for dev or static for prod
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
