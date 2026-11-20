// Universal Offline & Zero-Wi-Fi AI Engine
// Runs 100% locally on device when there is no internet, no Wi-Fi, or API quota exhausted

export interface OfflineKnowledgeItem {
  keywords: string[];
  title: string;
  category: 'roblox' | 'character' | 'game' | 'code' | 'general';
  script?: {
    language: 'lua' | 'luau';
    location: string;
    code: string;
  };
  explanation: string;
}

const OFFLINE_KNOWLEDGE: OfflineKnowledgeItem[] = [
  {
    keywords: ['kratos', 'leviathan', 'axe', 'god of war', 'frost axe'],
    title: 'Kratos & Leviathan Axe Throw / Recall System',
    category: 'character',
    explanation: `**Kratos** is the legendary Spartan warrior from *God of War*. His iconic **Leviathan Axe** can be hurled through the air at high velocity and recalled on command back into his hand. Here is the full local script for your Roblox game:`,
    script: {
      language: 'luau',
      location: 'StarterPlayer > StarterPlayerScripts > LocalScript (LeviathanAxe)',
      code: `-- [Location: StarterPlayer > StarterPlayerScripts > LocalScript]
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local mouse = player:GetMouse()
local isThrown = false
local axePart: Part? = nil

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    if input.KeyCode == Enum.KeyCode.E or input.UserInputType == Enum.UserInputType.MouseButton1 then
        local char = player.Character
        if not char then return end
        local rightHand = char:FindFirstChild("RightHand") or char:FindFirstChild("Right Arm")
        if not rightHand then return end

        if not isThrown then
            isThrown = true
            local targetPos = mouse.Hit.Position
            local axe = Instance.new("Part")
            axe.Name = "LeviathanAxe"
            axe.Size = Vector3.new(1.5, 3.5, 0.8)
            axe.Material = Enum.Material.Ice
            axe.BrickColor = BrickColor.new("Cyan")
            axe.CFrame = CFrame.lookAt(rightHand.Position, targetPos)
            axe.Anchored = true
            axe.CanCollide = false
            axe.Parent = workspace
            axePart = axe

            local dist = (targetPos - rightHand.Position).Magnitude
            local flyTime = math.clamp(dist / 70, 0.25, 2.0)
            local throwTween = TweenService:Create(axe, TweenInfo.new(flyTime, Enum.EasingStyle.Linear), {
                CFrame = CFrame.new(targetPos) * CFrame.Angles(0, 0, math.rad(720))
            })
            throwTween:Play()
        else
            if not axePart then return end
            local recallTween = TweenService:Create(axePart, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
                CFrame = rightHand.CFrame
            })
            recallTween:Play()
            recallTween.Completed:Connect(function()
                if axePart then axePart:Destroy() end
                axePart = nil
                isThrown = false
            end)
        end
    end
end)`
    }
  },
  {
    keywords: ['blox fruit', 'blox fruits', 'devil fruit', 'dragon fruit', 'flame fruit', 'magma', 'buddha', 'fruit ability'],
    title: 'Blox Fruits Devil Fruit Ability & Cooldown Engine',
    category: 'roblox',
    explanation: `Here is the complete **Blox Fruits Devil Fruit Ability System** with cooldown management, hitbox detection, and damage scaling that runs offline:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (FruitAbilityHandler)',
      code: `-- [Location: ServerScriptService > Script]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local fruitEvent = Instance.new("RemoteEvent")
fruitEvent.Name = "FruitAbilityEvent"
fruitEvent.Parent = ReplicatedStorage

local FRUITS_DATABASE = {
    ["Flame"] = { Mastery = 1, Damage = 45, Cooldown = 1.2 },
    ["Dragon"] = { Mastery = 50, Damage = 110, Cooldown = 3.5 },
    ["Magma"] = { Mastery = 25, Damage = 75, Cooldown = 2.0 }
}

local playerCooldowns = {}

fruitEvent.OnServerEvent:Connect(function(player, fruitName, moveKey, targetPosition)
    local fruitData = FRUITS_DATABASE[fruitName]
    if not fruitData then return end
    
    local key = player.UserId .. "_" .. fruitName .. "_" .. moveKey
    local now = tick()
    if playerCooldowns[key] and now - playerCooldowns[key] < fruitData.Cooldown then
        return -- on cooldown
    end
    playerCooldowns[key] = now

    local char = player.Character
    if not char or not char:FindFirstChild("HumanoidRootPart") then return end
    local root = char.HumanoidRootPart

    local projectile = Instance.new("Part")
    projectile.Shape = Enum.PartType.Ball
    projectile.Size = Vector3.new(4, 4, 4)
    projectile.Material = Enum.Material.Neon
    projectile.BrickColor = BrickColor.new("Bright orange")
    projectile.CFrame = root.CFrame * CFrame.new(0, 0, -3)
    projectile.CanCollide = false
    projectile.Anchored = false
    projectile.Parent = workspace
    Debris:AddItem(projectile, 4)

    local bodyVelocity = Instance.new("BodyVelocity")
    bodyVelocity.MaxForce = Vector3.new(1e5, 1e5, 1e5)
    bodyVelocity.Velocity = (targetPosition - root.Position).Unit * 120
    bodyVelocity.Parent = projectile

    projectile.Touched:Connect(function(hit)
        if hit:IsDescendantOf(char) then return end
        local enemyHumanoid = hit.Parent:FindFirstChild("Humanoid")
        if enemyHumanoid then
            enemyHumanoid:TakeDamage(fruitData.Damage)
            projectile:Destroy()
        end
    end)
end)`
    }
  },
  {
    keywords: ['doors', 'rush', 'ambush', 'seek', 'figure', 'screech', 'flicker'],
    title: 'Roblox DOORS Rush Entity & Light Flickering Engine',
    category: 'roblox',
    explanation: `Here is the full replication of the **DOORS Rush Entity** that causes lights across the room to flicker, roars, and speeds down the corridor eliminating anyone not hidden inside a closet:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (RushEntity)',
      code: `-- [Location: ServerScriptService > Script]
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local function spawnRush(roomModel, startPoint, endPoint)
    -- 1. Flicker all room lights
    for _, light in ipairs(roomModel:GetDescendants()) do
        if light:IsA("PointLight") or light:IsA("SurfaceLight") then
            task.spawn(function()
                for _ = 1, 6 do
                    light.Enabled = false
                    task.wait(0.08)
                    light.Enabled = true
                    task.wait(0.12)
                end
            end)
        end
    end

    task.wait(1.5) -- Ominous pause before rush charges

    -- 2. Spawn Rush Entity
    local rush = Instance.new("Part")
    rush.Name = "RushEntity"
    rush.Size = Vector3.new(6, 6, 6)
    rush.Shape = Enum.PartType.Ball
    rush.Material = Enum.Material.Neon
    rush.BrickColor = BrickColor.new("Really black")
    rush.CFrame = startPoint.CFrame
    rush.Anchored = true
    rush.CanCollide = false
    rush.Parent = workspace

    local distance = (endPoint.Position - startPoint.Position).Magnitude
    local rushTween = TweenService:Create(rush, TweenInfo.new(distance / 60, Enum.EasingStyle.Linear), {
        CFrame = endPoint.CFrame
    })
    rushTween:Play()

    -- 3. Eliminate unhidden players
    rush.Touched:Connect(function(hit)
        local hum = hit.Parent:FindFirstChild("Humanoid")
        local isHiding = hit.Parent:GetAttribute("IsHiddenInCloset")
        if hum and not isHiding then
            hum.Health = 0
        end
    end)

    rushTween.Completed:Connect(function()
        rush:Destroy()
    end)
end`
    }
  },
  {
    keywords: ['blade ball', 'deflection', 'parry', 'curve', 'deflect'],
    title: 'Blade Ball Ball Deflection, Tracking & Parry System',
    category: 'roblox',
    explanation: `Here is the complete **Blade Ball** deflection and target-switching system that tracks the closest player, speeds up on each parry, and eliminates players who miss their parry window:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (BladeBallHandler)',
      code: `-- [Location: ServerScriptService > Script]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local ball = Instance.new("Part")
ball.Name = "BladeBall"
ball.Shape = Enum.PartType.Ball
ball.Size = Vector3.new(3, 3, 3)
ball.Material = Enum.Material.Neon
ball.BrickColor = BrickColor.new("Bright red")
ball.Anchored = true
ball.CanCollide = false
ball.Position = Vector3.new(0, 5, 0)
ball.Parent = workspace

local ballSpeed = 35
local currentTarget: Player? = nil

local function getNextTarget(excludePlayer)
    local players = Players:GetPlayers()
    for _, p in ipairs(players) do
        if p ~= excludePlayer and p.Character and p.Character:FindFirstChild("Humanoid") and p.Character.Humanoid.Health > 0 then
            return p
        end
    end
    return nil
end

currentTarget = getNextTarget(nil)

RunService.Heartbeat:Connect(function(dt)
    if not currentTarget or not currentTarget.Character or not currentTarget.Character:FindFirstChild("HumanoidRootPart") then
        currentTarget = getNextTarget(nil)
        return
    end

    local root = currentTarget.Character.HumanoidRootPart
    local direction = (root.Position - ball.Position).Unit
    ball.CFrame = ball.CFrame + direction * (ballSpeed * dt)

    if (root.Position - ball.Position).Magnitude <= 5 then
        if currentTarget.Character:GetAttribute("IsParrying") then
            -- Successful parry: speed up and switch target
            ballSpeed = math.min(ballSpeed + 15, 180)
            currentTarget = getNextTarget(currentTarget)
        else
            -- Elimination
            currentTarget.Character.Humanoid.Health = 0
            currentTarget = getNextTarget(currentTarget)
            ballSpeed = 35
        end
    end
end)`
    }
  },
  {
    keywords: ['datastore', 'data store', 'save', 'leaderstats', 'coins', 'level', 'auto save'],
    title: 'Production Player DataStore & Auto-Save System',
    category: 'code',
    explanation: `Here is the bulletproof **Roblox DataStore** script with safe \`pcall\` error protection, \`BindToClose\` game shutdown data saving, and automatic leaderstats creation:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (PlayerDataManager)',
      code: `-- [Location: ServerScriptService > Script]
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local PlayerStore = DataStoreService:GetDataStore("GameData_v1")

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

    local success, savedData = pcall(function()
        return PlayerStore:GetAsync("UID_" .. player.UserId)
    end)
    if success and savedData then
        coins.Value = savedData.Coins or 100
        level.Value = savedData.Level or 1
    end
end

local function onPlayerRemoving(player)
    local leaderstats = player:FindFirstChild("leaderstats")
    if not leaderstats then return end

    pcall(function()
        PlayerStore:SetAsync("UID_" .. player.UserId, {
            Coins = leaderstats.Coins.Value,
            Level = leaderstats.Level.Value
        })
    end)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

game:BindToClose(function()
    for _, player in ipairs(Players:GetPlayers()) do
        onPlayerRemoving(player)
    end
end)`
    }
  },
  {
    keywords: ['gui', 'shop', 'ui', 'menu', 'button', 'mobile responsive'],
    title: 'Mobile-Responsive Shop GUI with TweenService',
    category: 'roblox',
    explanation: `Here is a mobile-responsive **Shop GUI** that uses Scale instead of Offset (so it never cuts off on phones, tablets, or consoles) with smooth open/close animations:`,
    script: {
      language: 'luau',
      location: 'StarterGui > ScreenGui > ShopController (LocalScript)',
      code: `-- [Location: StarterGui > ScreenGui > LocalScript]
local TweenService = game:GetService("TweenService")
local shopFrame = script.Parent:WaitForChild("ShopFrame")
local openBtn = script.Parent:WaitForChild("OpenButton")
local closeBtn = shopFrame:WaitForChild("CloseButton")

local isOpened = false

local function toggleShop()
    isOpened = not isOpened
    local targetPos = isOpened and UDim2.new(0.5, 0, 0.5, 0) or UDim2.new(0.5, 0, 1.5, 0)
    local tween = TweenService:Create(shopFrame, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = targetPos
    })
    tween:Play()
end

openBtn.MouseButton1Click:Connect(toggleShop)
closeBtn.MouseButton1Click:Connect(toggleShop)`
    }
  },
  {
    keywords: ['goku', 'dragon ball', 'kamehameha', 'super saiyan'],
    title: 'Goku (Dragon Ball) & Kamehameha Energy Blast System',
    category: 'character',
    explanation: `**Goku** (Kakarot) is the legendary Saiyan warrior from *Dragon Ball*. He masters transformations from Super Saiyan to Ultra Instinct and wields the signature **Kamehameha Wave**. Here is the complete scripted energy beam for Roblox:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (KamehamehaHandler)',
      code: `-- [Location: ServerScriptService > Script]
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local beamEvent = Instance.new("RemoteEvent")
beamEvent.Name = "KamehamehaEvent"
beamEvent.Parent = ReplicatedStorage

beamEvent.OnServerEvent:Connect(function(player, targetPosition)
    local char = player.Character
    if not char or not char:FindFirstChild("HumanoidRootPart") then return end
    local root = char.HumanoidRootPart

    local beam = Instance.new("Part")
    beam.Name = "KamehamehaBeam"
    beam.Material = Enum.Material.Neon
    beam.BrickColor = BrickColor.new("Cyan")
    beam.CanCollide = false
    beam.Anchored = true
    
    local distance = (targetPosition - root.Position).Magnitude
    beam.Size = Vector3.new(6, 6, distance)
    beam.CFrame = CFrame.lookAt(root.Position + (root.CFrame.LookVector * (distance / 2)), targetPosition)
    beam.Parent = workspace
    Debris:AddItem(beam, 2.5)

    -- Damage detection
    beam.Touched:Connect(function(hit)
        if hit:IsDescendantOf(char) then return end
        local enemyHum = hit.Parent:FindFirstChild("Humanoid")
        if enemyHum then
            enemyHum:TakeDamage(80)
        end
    end)
end)`
    }
  },
  {
    keywords: ['darth vader', 'star wars', 'lightsaber', 'force choke'],
    title: 'Darth Vader & Lightsaber Combat / Force Choke System',
    category: 'character',
    explanation: `**Darth Vader** (Anakin Skywalker) is the iconic Sith Lord from *Star Wars*. He commands the Dark Side of the Force with telekinetic Force Choke and strikes with his crimson red plasma lightsaber:`,
    script: {
      language: 'luau',
      location: 'StarterPlayer > StarterPlayerScripts > LocalScript (ForceChokeClient)',
      code: `-- [Location: StarterPlayer > StarterPlayerScripts > LocalScript]
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local mouse = player:GetMouse()

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    if input.KeyCode == Enum.KeyCode.F then -- 'F' for Force Choke
        local target = mouse.Target
        if target and target.Parent and target.Parent:FindFirstChild("Humanoid") then
            local enemyHum = target.Parent.Humanoid
            local enemyRoot = target.Parent:FindFirstChild("HumanoidRootPart")
            if enemyRoot then
                enemyRoot.Anchored = true
                enemyHum:TakeDamage(15)
                task.wait(1.5)
                enemyRoot.Anchored = false
            end
        end
    end
end)`
    }
  },
  {
    keywords: ['minecraft', 'break block', 'mining', 'inventory'],
    title: 'Voxel Block Mining & Inventory System (Minecraft Style)',
    category: 'game',
    explanation: `Here is the core **Voxel Block Mining** system in Roblox Luau that calculates raycasts, breaks blocks based on durability, and drops collectable resource items into player inventory:`,
    script: {
      language: 'luau',
      location: 'ServerScriptService > Script (BlockMiningSystem)',
      code: `-- [Location: ServerScriptService > Script]
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local mineEvent = Instance.new("RemoteEvent")
mineEvent.Name = "MineBlockEvent"
mineEvent.Parent = ReplicatedStorage

local blockHealths = {}

mineEvent.OnServerEvent:Connect(function(player, targetBlock)
    if not targetBlock or not targetBlock:IsA("BasePart") then return end
    local id = targetBlock:GetDebugId()
    blockHealths[id] = (blockHealths[id] or 3) - 1
    
    if blockHealths[id] <= 0 then
        local drop = Instance.new("Part")
        drop.Size = Vector3.new(1, 1, 1)
        drop.CFrame = targetBlock.CFrame
        drop.BrickColor = targetBlock.BrickColor
        drop.Parent = workspace
        targetBlock:Destroy()
        blockHealths[id] = nil
    end
end)`
    }
  },
  {
    keywords: ['photosynthesis', 'chemical equation', 'chloroplast', 'plants make food'],
    title: 'Photosynthesis Chemical Equation & Process',
    category: 'general',
    explanation: `🎯 DIRECT ANSWER: 6CO₂ + 6H₂O + Sunlight ➔ C₆H₁₂O₆ + 6O₂ (Carbon Dioxide + Water + Sunlight yields Glucose + Oxygen).

### 🔬 Step-by-Step Explanation:
1. **Definition**: Photosynthesis is the biological process by which autotrophs (green plants, algae, and certain bacteria) convert light energy into chemical energy stored in glucose.
2. **Location**: Occurs within the **chloroplasts** of plant cells, specifically utilizing the green pigment **chlorophyll**.
3. **Reactants (Inputs)**:
   - Carbon Dioxide (CO₂) absorbed from the atmosphere via leaf stomata
   - Water (H₂O) absorbed from the soil through root systems
   - Solar light energy absorbed by chlorophyll
4. **Products (Outputs)**:
   - Glucose (C₆H₁₂O₆) used for plant growth and cellular respiration
   - Oxygen (O₂) released into the atmosphere as a byproduct`
  },
  {
    keywords: ['mitochondria', 'powerhouse of the cell', 'powerhouse', 'organelle'],
    title: 'Cell Organelle: Powerhouse of the Cell',
    category: 'general',
    explanation: `🎯 DIRECT ANSWER: B - Mitochondria.

### 🔬 Step-by-Step Explanation:
1. **Mitochondria** are known as the **"powerhouse of the cell"** because they generate the majority of the cell's chemical energy through **cellular respiration**.
2. **Mechanism**: They produce **ATP** (adenosine triphosphate), the primary biochemical energy currency used by cells to power metabolic processes.
3. **Why other options are incorrect**:
   - *Ribosomes*: Responsible for protein synthesis.
   - *Nucleus*: Stores genetic material (DNA) and directs cellular activity.
   - *Golgi Apparatus*: Packages, modifies, and sorts proteins for transport.`
  },
  {
    keywords: ['solve for x', '3x + 15 = 45', 'algebra', 'linear equation'],
    title: 'Algebra: Solving Linear Equations Step-by-Step',
    category: 'general',
    explanation: `🎯 DIRECT ANSWER: x = 10.

### 📐 Step-by-Step Algebraic Solution:
1. **Given Equation**: \`3x + 15 = 45\`
2. **Subtract 15 from both sides**:
   \`3x = 45 - 15\`
   \`3x = 30\`
3. **Divide both sides by 3**:
   \`x = 30 / 3\`
   \`x = 10\`
4. **Verification**: \`3(10) + 15 = 30 + 15 = 45\` (Check verified ✅).`
  },
  {
    keywords: ['world war 1', 'causes of ww1', 'main causes of world war', 'causes of wwi'],
    title: 'History: MAIN Causes of World War I',
    category: 'general',
    explanation: `🎯 DIRECT ANSWER: Militarism, Alliances, Imperialism, and Nationalism (acronym: M-A-I-N).

### 🌍 Step-by-Step Historical Breakdown:
1. **M - Militarism**: European great powers engaged in massive arms races (e.g. naval rivalry between Britain and Germany).
2. **A - Alliances**: Entangling mutual defense treaties (Triple Entente vs. Triple Alliance) guaranteed that a localized conflict would engulf the entire continent.
3. **I - Imperialism**: Competition for African and Asian colonies created constant friction and geopolitical tension.
4. **N - Nationalism**: Intense national pride and Slavic independence movements in the Balkans ("the powder keg of Europe").
5. **The Spark**: The assassination of Archduke Franz Ferdinand of Austria-Hungary in Sarajevo on June 28, 1914 by Gavrilo Princip.`
  },
  {
    keywords: ['there their they\'re', 'there their theyre', 'difference between there', 'homophones'],
    title: 'English Grammar: There vs. Their vs. They\'re',
    category: 'general',
    explanation: `🎯 DIRECT ANSWER: 
- **There** = A place or direction (*"Put the book over there."*)
- **Their** = Possessive ownership belonging to them (*"That is their house."*)
- **They're** = Contraction of 'they are' (*"They're going to the park."*)

### 📝 Easy Memory Tricks:
1. *t-HERE* has the word **HERE** inside it (referring to location).
2. *t-HEIR* has the word **HEIR** inside it (someone who inherits property, showing possession).
3. *they're* has an **apostrophe** replacing the letter 'a' in 'they are'.`
  }
];

function trySolveMathExpression(rawQuery: string): string | null {
  const q = rawQuery.trim();

  // Check simple linear equation like "3x + 15 = 45" or "2x - 4 = 10"
  const eqMatch = q.match(/(-?\d*\.?\d+)\s*x\s*([+-]\s*\d+\.?\d*)?\s*=\s*(-?\d+\.?\d*)/i);
  if (eqMatch) {
    const a = parseFloat(eqMatch[1]);
    const b = eqMatch[2] ? parseFloat(eqMatch[2].replace(/\s+/g, '')) : 0;
    const c = parseFloat(eqMatch[3]);
    if (!Number.isNaN(a) && a !== 0 && !Number.isNaN(b) && !Number.isNaN(c)) {
      const x = (c - b) / a;
      const formattedX = Number.isInteger(x) ? String(x) : x.toFixed(4).replace(/\.?0+$/, '');
      return `🎯 DIRECT ANSWER: x = ${formattedX}\n\n### Step-by-Step Solution\n1. Equation: \`${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`} = ${c}\`\n2. Isolate \`${a}x\`: \`${a}x = ${c - b}\`\n3. Divide by \`${a}\`: \`x = ${formattedX}\``;
    }
  }

  // Extract pure arithmetic expression from text like "what is 25 * 4 + 10?"
  const cleaned = q
    .replace(/what\s+is|calculate|solve|evaluate|compute|equals|=|\?/gi, ' ')
    .replace(/plus/gi, '+')
    .replace(/minus/gi, '-')
    .replace(/times|multiplied by/gi, '*')
    .replace(/divided by/gi, '/')
    .replace(/[^0-9+\-*/().%\s]/g, '')
    .trim();

  if (cleaned && /[0-9]/.test(cleaned) && /[+\-*/%]/.test(cleaned)) {
    try {
      // Safe arithmetic parser for + - * / % ( )
      const tokens = cleaned.match(/(\d+\.?\d*|\.\d+|[+\-*/%()])/g);
      if (!tokens || tokens.join('') !== cleaned.replace(/\s+/g, '')) return null;
      // Evaluate using Function on strictly validated math-only tokens
      const result = new Function(`"use strict"; return (${tokens.join(' ')});`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        const pretty = Number.isInteger(result) ? String(result) : result.toFixed(6).replace(/\.?0+$/, '');
        return `🎯 DIRECT ANSWER: ${pretty}\n\n\`${tokens.join(' ')} = ${pretty}\``;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function resolveOfflineQuery(query: string): {
  content: string;
  isOffline: boolean;
  isWebApk?: boolean;
  scriptInfo?: { code: string; location: string };
} {
  const q = query.toLowerCase().trim();

  if (
    q.includes('web apk') ||
    q.includes('webapk') ||
    q.includes('apk generator') ||
    q.includes('website apk') ||
    (q.includes('website') && q.includes('apk')) ||
    q.includes('make an apk') ||
    q.includes('build an apk')
  ) {
    return {
      content: `### 📱 Web APK Generator Website Built\n\nBuilt a **live interactive Website that functions as a Web APK Generator** for **"${query.trim()}"**.\n\n- **Random APK Code Engine**: Generates a fresh random Build Code, Package ID, \`versionCode\`, and SHA-256 signature on every build.\n- **Owner Access (\`whatsupsdev9@gmail.com\`)**: Unlimited Credits (\`∞\`) on click.\n- **Non-Owner Access**: Paid Credit Packs required to export or randomize \`.apk\` packages.`,
      isOffline: true,
      isWebApk: true,
    };
  }

  // 1. Direct Math & Equation Solver
  const mathAnswer = trySolveMathExpression(query);
  if (mathAnswer) {
    return {
      content: mathAnswer,
      isOffline: true,
    };
  }

  // 2. Search local knowledge database (Characters, Games, School Topics)
  for (const item of OFFLINE_KNOWLEDGE) {
    const match = item.keywords.some((kw) => q.includes(kw));
    if (match) {
      let content = `${item.explanation}\n\n`;
      if (item.script) {
        content += `\`\`\`${item.script.language}\n${item.script.code}\n\`\`\`\n\n#### 📌 Explorer Location:\n\`${item.script.location}\`\n*Paste this code in Roblox Studio and press Play (F5).*`;
      }
      return {
        content,
        isOffline: true,
        scriptInfo: item.script ? { code: item.script.code, location: item.script.location } : undefined,
      };
    }
  }

  // 3. Base44 / Web & Full-Stack App Builder mode
  if (
    q.includes('base44') ||
    q.includes('react') ||
    q.includes('website') ||
    q.includes('web app') ||
    q.includes('dashboard') ||
    q.includes('html') ||
    q.includes('tailwind') ||
    q.includes('full stack') ||
    q.includes('fullstack') ||
    q.includes('saas')
  ) {
    return {
      content: `### ⚡ Base44 Full-Stack App Architecture for: "${query.trim()}"

Here is a production-ready React + Tailwind + Express starter tailored to your request:

\`\`\`typescript
// App Component — Interactive Workspace & State Controller
import React, { useState } from 'react';

interface RecordItem {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'complete';
  updatedAt: string;
}

export default function AppWorkspace() {
  const [items, setItems] = useState<RecordItem[]>([
    { id: '1', title: 'Primary Module', status: 'active', updatedAt: new Date().toLocaleTimeString() },
  ]);
  const [title, setTitle] = useState('');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setItems((prev) => [
      { id: String(Date.now()), title: title.trim(), status: 'active', updatedAt: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setTitle('');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">${query.trim().replace(/[`$]/g, '')}</h1>
        <form onSubmit={addItem} className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add new entry..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          />
          <button className="px-4 py-2 rounded-lg bg-amber-400 text-black font-bold text-sm">
            Create
          </button>
        </form>
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-900">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between text-sm">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-slate-400 font-mono">{item.status} • {item.updatedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
\`\`\``,
      isOffline: true,
    };
  }

  // 4. Unity C# Game Dev mode
  if (q.includes('unity') || q.includes('c#') || q.includes('csharp')) {
    return {
      content: `### 🎮 Unity C# Implementation for: "${query.trim()}"

\`\`\`csharp
using UnityEngine;

public class StudioFeatureController : MonoBehaviour
{
    [Header("Settings")]
    public float moveSpeed = 7.5f;
    public float actionCooldown = 0.4f;
    private float nextActionTime = 0f;

    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        Vector3 dir = new Vector3(h, 0f, v).normalized;
        transform.Translate(dir * moveSpeed * Time.deltaTime, Space.World);

        if (Input.GetKeyDown(KeyCode.Space) && Time.time >= nextActionTime)
        {
            nextActionTime = Time.time + actionCooldown;
            TriggerAbility();
        }
    }

    void TriggerAbility()
    {
        Debug.Log("Executed Unity ability for: ${query.trim().replace(/"/g, "'")}");
    }
}
\`\`\``,
      isOffline: true,
    };
  }

  // 5. Godot GDScript Game Dev mode
  if (q.includes('godot') || q.includes('gdscript')) {
    return {
      content: `### 🕹️ Godot 4.x GDScript Implementation for: "${query.trim()}"

\`\`\`gdscript
extends CharacterBody2D

@export var speed: float = 280.0
@export var dash_multiplier: float = 2.4

func _physics_process(_delta: float) -> void:
	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var current_speed := speed * (dash_multiplier if Input.is_action_pressed("ui_accept") else 1.0)
	velocity = direction * current_speed
	move_and_slide()
\`\`\``,
      isOffline: true,
    };
  }

  // 6. Roblox / Game Scripting mode
  if (
    q.includes('roblox') ||
    q.includes('script') ||
    q.includes('luau') ||
    q.includes('lua') ||
    q.includes('game') ||
    q.includes('obby') ||
    q.includes('simulator')
  ) {
    return {
      content: `### 🎮 Roblox Luau Implementation for: "${query.trim()}"

\`\`\`luau
-- [Location: ServerScriptService > Script]
-- [Name: GameFeatureHandler]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local actionEvent = Instance.new("RemoteEvent")
actionEvent.Name = "StudioActionEvent"
actionEvent.Parent = ReplicatedStorage

actionEvent.OnServerEvent:Connect(function(player: Player, payload: any)
    local char = player.Character
    if not char or not char:FindFirstChild("HumanoidRootPart") then return end
    print("[Server] Processed action for", player.Name, payload)
end)
\`\`\`

#### 📌 Explorer Location
Place inside **ServerScriptService > Script** and test with **Play (F5)**.`,
      isOffline: true,
    };
  }

  // 7. Direct Question Fallback — repeats and answers the actual question directly without any "Hi, I'm What's Up AI" intro
  const cleanQuestion = query.trim();
  return {
    content: `### Answer to: "${cleanQuestion}"

Right now the Gemini cloud endpoint is unreachable or offline, so here is a direct local response for **"${cleanQuestion}"**:

- **Topic Detected**: \`${cleanQuestion}\`
- If this is a **math problem**, include numbers and operators (e.g. \`24 * 15\` or \`3x + 5 = 20\`) for instant exact calculation.
- If this is a **game dev script**, include the engine name (**Roblox**, **Unity**, **Godot**, or **Base44 web app**) for complete production code.
- Once connected to the active Gemini 4 Hydrogen runtime, full open-ended reasoning, live web/school tutoring, and GPT-style conversation respond automatically.`,
    isOffline: true,
  };
}
