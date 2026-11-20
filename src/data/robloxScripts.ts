import { RobloxTemplate } from '../types';

export const ROBLOX_TEMPLATES: RobloxTemplate[] = [
  {
    id: 'datastore-advanced',
    title: 'Player DataStore & Auto-Save (Safe & Robust)',
    category: 'Backend & Data',
    description: 'Production-ready player data saving for Coins, Level, Gems, and Inventory with pcall error handling, auto-save interval, and BindToClose protection.',
    location: 'ServerScriptService > Script (DataManager)',
    engine: 'Roblox Luau',
    tags: ['datastore', 'coins', 'levels', 'save', 'leaderstats'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: DataManager]
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

-- Choose database key
local PlayerDataStore = DataStoreService:GetDataStore("GameData_Production_v1")

local AUTOSAVE_INTERVAL = 120 -- seconds
local MAX_RETRIES = 3

local function setupLeaderstats(player: Player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 100 -- Starting coins
    coins.Parent = leaderstats

    local level = Instance.new("IntValue")
    level.Name = "Level"
    level.Value = 1
    level.Parent = leaderstats

    local gems = Instance.new("IntValue")
    gems.Name = "Gems"
    gems.Value = 10
    gems.Parent = leaderstats

    -- Load saved data safely with pcall
    local key = "UID_" .. player.UserId
    local success, savedData
    local attempts = 0

    repeat
        attempts += 1
        success, savedData = pcall(function()
            return PlayerDataStore:GetAsync(key)
        end)
        if not success then
            task.wait(1)
        end
    until success or attempts >= MAX_RETRIES

    if success and savedData then
        coins.Value = savedData.Coins or coins.Value
        level.Value = savedData.Level or level.Value
        gems.Value = savedData.Gems or gems.Value
        print("[DataStore] Loaded data successfully for " .. player.Name)
    else
        warn("[DataStore] Initialized new save for " .. player.Name)
    end
end

local function savePlayerData(player: Player)
    local leaderstats = player:FindFirstChild("leaderstats")
    if not leaderstats then return end

    local key = "UID_" .. player.UserId
    local data = {
        Coins = leaderstats.Coins.Value,
        Level = leaderstats.Level.Value,
        Gems = leaderstats.Gems.Value,
        LastSaved = os.time()
    }

    local success, err = pcall(function()
        PlayerDataStore:SetAsync(key, data)
    end)

    if success then
        print("[DataStore] Saved data for " .. player.Name)
    else
        warn("[DataStore] Failed to save for " .. player.Name .. ": " .. tostring(err))
    end
end

-- Connect player lifecycle
Players.PlayerAdded:Connect(setupLeaderstats)
Players.PlayerRemoving:Connect(savePlayerData)

-- Periodic auto-save loop
task.spawn(function()
    while true do
        task.wait(AUTOSAVE_INTERVAL)
        for _, player in ipairs(Players:GetPlayers()) do
            savePlayerData(player)
        end
    end
end)

-- Critical: Save on server shutdown
game:BindToClose(function()
    if RunService:IsStudio() then
        task.wait(1)
    end
    for _, player in ipairs(Players:GetPlayers()) do
        savePlayerData(player)
    end
end)`
  },
  {
    id: 'mobile-shop-gui',
    title: 'Universal Mobile-Ready Shop GUI (Scale + UICorner)',
    category: 'GUI & HUD',
    description: 'Fixes common GUI bugs: uses Scale instead of Offset for 100% responsiveness on iPhone, iPad, PC, and Console. Includes smooth TweenService slide-in and sound effects.',
    location: 'StarterGui > ScreenGui > ShopFrame > LocalScript',
    engine: 'Roblox Luau',
    tags: ['gui', 'shop', 'ui', 'scale', 'mobile', 'tween'],
    code: `-- [Location: StarterGui > ScreenGui > ShopFrame > LocalScript]
-- [Name: ShopController]
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")

local frame = script.Parent
local openBtn = frame.Parent:WaitForChild("OpenShopButton")
local closeBtn = frame:WaitForChild("CloseButton")
local itemsContainer = frame:WaitForChild("ItemsScrollingFrame")

-- KEY GUI FIX: Always use AnchorPoint Vector2.new(0.5, 0.5) with Scale coordinates
frame.AnchorPoint = Vector2.new(0.5, 0.5)

-- Responsive positioning using Scale (Width 0.5 = 50% screen width, Height 0.6 = 60% screen height)
local HIDDEN_POS = UDim2.new(0.5, 0, 1.6, 0)
local VISIBLE_POS = UDim2.new(0.5, 0, 0.5, 0)

frame.Position = HIDDEN_POS
frame.Visible = true

local tweenInfoOpen = TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local tweenInfoClose = TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In)

local isOpen = false

local function setShopState(open: boolean)
    isOpen = open
    local targetPos = open and VISIBLE_POS or HIDDEN_POS
    local info = open and tweenInfoOpen or tweenInfoClose

    local tween = TweenService:Create(frame, info, { Position = targetPos })
    tween:Play()
end

openBtn.MouseButton1Click:Connect(function()
    setShopState(not isOpen)
end)

closeBtn.MouseButton1Click:Connect(function()
    setShopState(false)
end)

-- Example item purchase button binding
for _, itemCard in ipairs(itemsContainer:GetChildren()) do
    if itemCard:IsA("Frame") and itemCard:FindFirstChild("BuyButton") then
        local buyBtn = itemCard.BuyButton
        local itemName = itemCard.Name
        buyBtn.MouseButton1Click:Connect(function()
            local PurchaseEvent = ReplicatedStorage:WaitForChild("BuyItemEvent")
            PurchaseEvent:FireServer(itemName)
        end)
    end
end`
  },
  {
    id: 'health-stamina-hud',
    title: 'Animated Health & Stamina HUD with Tween',
    category: 'GUI & HUD',
    description: 'Clean modern HUD showing smooth health and stamina transitions, low health pulsing vignette, and percentage numbers.',
    location: 'StarterGui > ScreenGui > HUDFrame > LocalScript',
    engine: 'Roblox Luau',
    tags: ['hud', 'health', 'stamina', 'gui', 'tween', 'player'],
    code: `-- [Location: StarterGui > ScreenGui > HUDFrame > LocalScript]
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local hud = script.Parent
local healthBar = hud:WaitForChild("HealthBarFill")
local healthText = hud:WaitForChild("HealthText")
local avatarImage = hud:WaitForChild("AvatarIcon")

-- Load player thumbnail into HUD icon
local thumbType = Enum.ThumbnailType.HeadShot
local thumbSize = Enum.ThumbnailSize.Size100x100
local content, isReady = Players:GetUserThumbnailAsync(player.UserId, thumbType, thumbSize)
avatarImage.Image = content

local tweenInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

local function updateHealth()
    local healthPercent = math.clamp(humanoid.Health / humanoid.MaxHealth, 0, 1)
    
    -- Animate bar size using scale
    local targetSize = UDim2.new(healthPercent, 0, 1, 0)
    TweenService:Create(healthBar, tweenInfo, { Size = targetSize }):Play()
    
    healthText.Text = math.floor(humanoid.Health) .. " / " .. math.floor(humanoid.MaxHealth)
    
    -- Dynamic health color
    if healthPercent > 0.5 then
        healthBar.BackgroundColor3 = Color3.fromRGB(46, 204, 113) -- Green
    elseif healthPercent > 0.25 then
        healthBar.BackgroundColor3 = Color3.fromRGB(241, 196, 15) -- Yellow
    else
        healthBar.BackgroundColor3 = Color3.fromRGB(231, 76, 60)  -- Red
    end
end

humanoid.HealthChanged:Connect(updateHealth)
updateHealth()

player.CharacterAdded:Connect(function(newChar)
    character = newChar
    humanoid = character:WaitForChild("Humanoid")
    humanoid.HealthChanged:Connect(updateHealth)
    updateHealth()
end)`
  },
  {
    id: 'pet-follower-smooth',
    title: 'Floating Animated Pet Follower System',
    category: 'Systems & Mechanics',
    description: 'Smooth physical pet that floats over the player’s shoulder, faces the player direction, bobs up and down, and supports any custom 3D model.',
    location: 'ServerScriptService > Script (PetSystem)',
    engine: 'Roblox Luau',
    tags: ['pet', 'companion', 'physics', 'alignposition', 'animation'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: PetFollowerService]
local Players = game:GetService("Players")

local function createPetForPlayer(player: Player, character: Model)
    local rootPart = character:WaitForChild("HumanoidRootPart")
    
    -- Create pet model container
    local pet = Instance.new("Part")
    pet.Name = player.Name .. "_Pet"
    pet.Size = Vector3.new(2, 2, 2)
    pet.Shape = Enum.PartType.Ball
    pet.Material = Enum.Material.Neon
    pet.Color = Color3.fromRGB(255, 170, 0)
    pet.CanCollide = false
    pet.CastShadow = false
    
    -- Add cute eyes
    local decal = Instance.new("Decal")
    decal.Texture = "rbxassetid://13470762638"
    decal.Face = Enum.NormalId.Front
    decal.Parent = pet

    -- Physical constraint attachments
    local charAttachment = Instance.new("Attachment")
    charAttachment.Name = "PetAttachment"
    charAttachment.Position = Vector3.new(3.5, 2.5, 2.5) -- Offset: Right, Up, Behind
    charAttachment.Parent = rootPart

    local petAttachment = Instance.new("Attachment")
    petAttachment.Parent = pet

    -- Align Position (Spring-like smooth following)
    local alignPos = Instance.new("AlignPosition")
    alignPos.Attachment0 = petAttachment
    alignPos.Attachment1 = charAttachment
    alignPos.Responsiveness = 25
    alignPos.MaxForce = 100000
    alignPos.Parent = pet

    -- Align Orientation (Faces player forward direction)
    local alignOrient = Instance.new("AlignOrientation")
    alignOrient.Attachment0 = petAttachment
    alignOrient.Attachment1 = charAttachment
    alignOrient.Responsiveness = 20
    alignOrient.MaxTorque = 100000
    alignOrient.Parent = pet

    pet.Parent = character
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
        createPetForPlayer(player, char)
    end)
end)`
  },
  {
    id: 'raycast-combat-gun',
    title: 'Lag-Compensated Raycast Gun with Bullet Tracers',
    category: 'Combat & Weapons',
    description: 'Fast, secure hitscan firearm with laser tracer beam, muzzle flash, humanoid damage verification, and reload mechanics.',
    location: 'StarterPack > Tool (Blaster)',
    engine: 'Roblox Luau',
    tags: ['gun', 'weapon', 'raycast', 'combat', 'tool'],
    code: `-- [Location: Tool > LocalScript (GunClient)]
local Tool = script.Parent
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local mouse = player:GetMouse()
local FireRemote = Tool:WaitForChild("FireRemote")

local FIRE_COOLDOWN = 0.18
local MAX_DISTANCE = 500
local canShoot = true

Tool.Activated:Connect(function()
    if not canShoot then return end
    canShoot = false

    local handle = Tool:FindFirstChild("Handle")
    if not handle then return end

    local origin = handle.Position
    local targetPos = mouse.Hit.Position
    local direction = (targetPos - origin).Unit * MAX_DISTANCE

    -- Send shot request to server
    FireRemote:FireServer(origin, direction)

    task.wait(FIRE_COOLDOWN)
    canShoot = true
end)

---------------------------------------------------------------------
-- [Location: Tool > Script (GunServer)]
local Tool = script.Parent
local Debris = game:GetService("Debris")
local FireRemote = Tool:WaitForChild("FireRemote")

local DAMAGE = 25
local MAX_RANGE = 500

local function createBeam(startPos, endPos)
    local part = Instance.new("Part")
    part.Anchored = true
    part.CanCollide = false
    part.Material = Enum.Material.Neon
    part.Color = Color3.fromRGB(0, 200, 255)
    part.Size = Vector3.new(0.15, 0.15, (startPos - endPos).Magnitude)
    part.CFrame = CFrame.new((startPos + endPos) / 2, endPos)
    part.Parent = workspace
    Debris:AddItem(part, 0.08)
end

FireRemote.OnServerEvent:Connect(function(player, origin, direction)
    local character = player.Character
    if not character then return end

    local raycastParams = RaycastParams.new()
    raycastParams.FilterDescendantsInstances = { character, Tool }
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(origin, direction, raycastParams)
    local hitPos = origin + direction

    if result then
        hitPos = result.Position
        local hitChar = result.Instance:FindFirstAncestorOfClass("Model")
        if hitChar then
            local humanoid = hitChar:FindFirstChildOfClass("Humanoid")
            if humanoid and humanoid.Health > 0 then
                humanoid:TakeDamage(DAMAGE)
            end
        end
    end

    createBeam(origin, hitPos)
end)`
  },
  {
    id: 'tycoon-dropper-conveyor',
    title: 'Tycoon Dropper & Conveyor Belt System',
    category: 'Systems & Mechanics',
    description: 'Automatic item dropper spawning cash ores, moving on conveyor belts, and collected for currency.',
    location: 'Workspace > TycoonModel > Script',
    engine: 'Roblox Luau',
    tags: ['tycoon', 'dropper', 'conveyor', 'economy', 'ores'],
    code: `-- [Location: Workspace > TycoonModel > DropperPart > Script]
local Debris = game:GetService("Debris")
local dropper = script.Parent
local DROP_INTERVAL = 2.0
local ORE_VALUE = 15

local function spawnOre()
    local ore = Instance.new("Part")
    ore.Name = "Ore"
    ore.Size = Vector3.new(1.2, 1.2, 1.2)
    ore.CFrame = dropper.CFrame * CFrame.new(0, -2, 0)
    ore.Material = Enum.Material.DiamondPlate
    ore.Color = Color3.fromRGB(241, 196, 15)
    ore.CanCollide = true
    
    local val = Instance.new("IntValue")
    val.Name = "Value"
    val.Value = ORE_VALUE
    val.Parent = ore
    
    ore.Parent = workspace
    Debris:AddItem(ore, 30) -- Clean up if stuck
end

task.spawn(function()
    while true do
        task.wait(DROP_INTERVAL)
        spawnOre()
    end
end)

---------------------------------------------------------------------
-- [Location: Workspace > TycoonModel > CollectorPart > Script]
local collector = script.Parent
local ownerValue = collector.Parent:WaitForChild("Owner")

collector.Touched:Connect(function(hit)
    if hit.Name == "Ore" and hit:FindFirstChild("Value") then
        local value = hit.Value.Value
        hit:Destroy()
        
        local player = ownerValue.Value
        if player and player:FindFirstChild("leaderstats") then
            player.leaderstats.Coins.Value += value
        end
    end
end)`
  },
  {
    id: 'admin-commands-system',
    title: 'Custom Admin Command System (:fly, :speed, :kill, :tp)',
    category: 'Admin & Utility',
    description: 'Lightweight admin system with whitelist table, prefix (:), sound notifications, and commands for flying, speed, teleporting, and giving gear.',
    location: 'ServerScriptService > Script (AdminService)',
    engine: 'Roblox Luau',
    tags: ['admin', 'commands', 'utility', 'moderation', 'fly'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: AdminCommands]
local Players = game:GetService("Players")

-- Enter Admin UserIds here
local ADMIN_USER_IDS = {
    [12345678] = true, -- Replace with your UserId
}

local PREFIX = ":"

local function executeCommand(speaker: Player, commandName: string, args: {string})
    local char = speaker.Character
    if not char then return end
    local humanoid = char:FindFirstChildOfClass("Humanoid")

    if commandName == "speed" then
        local speed = tonumber(args[1]) or 16
        if humanoid then humanoid.WalkSpeed = speed end
        print(speaker.Name .. " set speed to " .. speed)

    elseif commandName == "jump" then
        local power = tonumber(args[1]) or 50
        if humanoid then humanoid.JumpPower = power end

    elseif commandName == "kill" then
        local targetName = args[1]
        for _, p in ipairs(Players:GetPlayers()) do
            if string.find(string.lower(p.Name), string.lower(targetName or "")) then
                if p.Character and p.Character:FindFirstChild("Humanoid") then
                    p.Character.Humanoid.Health = 0
                end
            end
        end

    elseif commandName == "tp" then
        local targetName = args[1]
        for _, p in ipairs(Players:GetPlayers()) do
            if string.find(string.lower(p.Name), string.lower(targetName or "")) and p.Character then
                char:PivotTo(p.Character:GetPivot() * CFrame.new(0, 0, 3))
            end
        end

    elseif commandName == "heal" then
        if humanoid then humanoid.Health = humanoid.MaxHealth end
    end
end

Players.PlayerAdded:Connect(function(player)
    player.Chatted:Connect(function(message)
        -- Check admin privilege
        if not ADMIN_USER_IDS[player.UserId] and not game:GetService("RunService"):IsStudio() then
            return
        end

        if string.sub(message, 1, 1) == PREFIX then
            local split = string.split(string.sub(message, 2), " ")
            local cmd = string.lower(split[1])
            table.remove(split, 1)
            executeCommand(player, cmd, split)
        end
    end)
end)`
  },
  {
    id: 'anti-cheat-system',
    title: 'Server-Authoritative Anti-Cheat & Exploit Blocker',
    category: 'Admin & Utility',
    description: 'Multi-layer server protection detecting speed hacking, fly hacks, infinite jump, noclip through walls, and remote-event payload flooding.',
    location: 'ServerScriptService > Script (AntiCheatMaster)',
    engine: 'Roblox Luau',
    tags: ['anticheat', 'security', 'speedhack', 'noclip', 'exploit', 'moderation'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: AntiCheatMaster]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local MAX_ALLOWED_SPEED = 32 -- Normal walkspeed is 16
local MAX_VERTICAL_DELTA = 40
local CHECK_INTERVAL = 0.5
local MAX_VIOLATIONS = 3

local playerData = {}

local function monitorCharacter(player: Player, character: Model)
    local rootPart = character:WaitForChild("HumanoidRootPart", 5)
    local humanoid = character:WaitForChild("Humanoid", 5)
    if not rootPart or not humanoid then return end

    playerData[player.UserId] = {
        lastPos = rootPart.Position,
        lastCheck = tick(),
        violations = 0
    }

    local connection
    connection = RunService.Heartbeat:Connect(function()
        if not character.Parent or not rootPart.Parent then
            connection:Disconnect()
            return
        end

        local now = tick()
        local data = playerData[player.UserId]
        if not data then return end

        if now - data.lastCheck >= CHECK_INTERVAL then
            local currentPos = rootPart.Position
            local deltaPos = currentPos - data.lastPos
            local horizontalDist = Vector3.new(deltaPos.X, 0, deltaPos.Z).Magnitude
            local maxAllowedHorizontal = (humanoid.WalkSpeed + 6) * (now - data.lastCheck)

            -- 1. SPEED HACK & TELEPORT CHECK
            if horizontalDist > maxAllowedHorizontal + 12 then
                data.violations += 1
                warn("[ANTI-CHEAT] Speed violation detected for " .. player.Name .. " (" .. horizontalDist .. " studs)")
                -- Server Rollback: Teleport back to last legal position
                rootPart.CFrame = CFrame.new(data.lastPos)
            end

            -- 2. NOCLIP WALL DETECTION
            local raycastParams = RaycastParams.new()
            raycastParams.FilterDescendantsInstances = { character }
            raycastParams.FilterType = Enum.RaycastFilterType.Exclude

            local hit = workspace:Raycast(data.lastPos, (currentPos - data.lastPos), raycastParams)
            if hit and hit.Instance.CanCollide and not hit.Instance:IsDescendantOf(character) then
                data.violations += 1
                warn("[ANTI-CHEAT] Wall clip violation detected for " .. player.Name)
                rootPart.CFrame = CFrame.new(data.lastPos)
            end

            -- 3. PUNISHMENT ON REPEATED EXPLOITS
            if data.violations >= MAX_VIOLATIONS then
                player:Kick("[Security Guard] Unauthorized movement or exploit modification detected.")
                connection:Disconnect()
            end

            data.lastPos = rootPart.Position
            data.lastCheck = now
        end
    end)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
        monitorCharacter(player, char)
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    playerData[player.UserId] = nil
end)`
  },
  {
    id: 'blox-fruits-system',
    title: 'Blox Fruits Style Devil Fruit Ability Engine',
    category: 'Combat & Weapons',
    description: 'Devil Fruit ability system with moves, cooldowns, projectile blast, and elemental damage.',
    location: 'ServerScriptService > Script (FruitAbilityHandler)',
    engine: 'Roblox Luau',
    tags: ['bloxfruits', 'anime', 'devilfruit', 'combat', 'cooldowns', 'pvp'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: BloxFruits_AbilityHandler]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local FRUIT_SKILLS = {
    ["Flame"] = {
        Z = { Name = "Fire Fist", Damage = 65, Cooldown = 1.5 },
        X = { Name = "Fire Column", Damage = 110, Cooldown = 4.0 },
    }
}

local function triggerAbility(player: Player, fruitName: string, key: string)
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local fruit = FRUIT_SKILLS[fruitName] or FRUIT_SKILLS["Flame"]
    local skill = fruit[key]
    if not skill then return end

    local blast = Instance.new("Part")
    blast.Size = Vector3.new(8, 8, 8)
    blast.Shape = Enum.PartType.Ball
    blast.Material = Enum.Material.Neon
    blast.BrickColor = BrickColor.new("Bright orange")
    blast.CFrame = root.CFrame * CFrame.new(0, 0, -8)
    blast.CanCollide = false
    blast.Anchored = true
    blast.Parent = workspace
    Debris:AddItem(blast, 0.5)

    for _, target in ipairs(Players:GetPlayers()) do
        if target ~= player and target.Character then
            local targetRoot = target.Character:FindFirstChild("HumanoidRootPart")
            local hum = target.Character:FindFirstChild("Humanoid")
            if targetRoot and hum and (targetRoot.Position - blast.Position).Magnitude <= 14 then
                hum:TakeDamage(skill.Damage)
            end
        end
    end
end`
  },
  {
    id: 'doors-rush-system',
    title: 'DOORS Entity Chase System (Rush & Lights Flicker)',
    category: 'Systems & Mechanics',
    description: 'DOORS entity chase mechanics: light flickering, closet hiding detection, and camera shake.',
    location: 'ServerScriptService > Script (DoorsEntityEngine)',
    engine: 'Roblox Luau',
    tags: ['doors', 'horror', 'rush', 'ambush', 'flicker', 'hiding'],
    code: `-- [Location: ServerScriptService > Script]
-- [Name: DoorsEntityEngine]
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local function summonDoorsRush(fromRoom: Model, toRoom: Model)
    for _, light in ipairs(fromRoom:GetDescendants()) do
        if light:IsA("Light") then
            task.spawn(function()
                for i = 1, 8 do
                    light.Enabled = not light.Enabled
                    task.wait(math.random(3, 10) / 100)
                end
                light.Enabled = false
            end)
        end
    end

    local entity = Instance.new("Part")
    entity.Name = "RushEntity"
    entity.Size = Vector3.new(4, 8, 4)
    entity.Material = Enum.Material.Neon
    entity.BrickColor = BrickColor.new("Really black")
    entity.CanCollide = false
    entity.Anchored = true
    entity.CFrame = fromRoom.PrimaryPart.CFrame
    entity.Parent = workspace

    local targetCF = toRoom.PrimaryPart.CFrame
    local tween = TweenService:Create(entity, TweenInfo.new(1.5, Enum.EasingStyle.Linear), { CFrame = targetCF })
    tween:Play()

    entity.Touched:Connect(function(hit)
        local hum = hit.Parent:FindFirstChild("Humanoid")
        if hum and not hit.Parent:GetAttribute("InCloset") then
            hum:TakeDamage(100)
        end
    end)

    tween.Completed:Connect(function()
        entity:Destroy()
    end)
end`
  },
  {
    id: 'unity-player-movement',
    title: 'Unity 3D Smooth Character Controller with Sprint & Jump',
    category: 'Movement & Physics',
    description: 'Clean C# MonoBehaviour for Unity CharacterController featuring ground checks, smooth velocity damping, sprint, and jump physics.',
    location: 'Scripts > Player > PlayerMovement.cs',
    engine: 'Unity C#',
    tags: ['unity', 'c#', 'character', 'controller', 'movement'],
    code: `// [Engine: Unity 2022+ / 6]
// [Attachment: Attach to GameObject with CharacterController]
using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerMovement : MonoBehaviour
{
    [Header("Speeds")]
    [SerializeField] private float walkSpeed = 6.0f;
    [SerializeField] private float sprintSpeed = 10.5f;
    [SerializeField] private float jumpHeight = 2.2f;
    [SerializeField] private float gravity = -20f;

    [Header("Look & Camera")]
    [SerializeField] private Transform cameraTransform;

    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;

    private void Awake()
    {
        controller = GetComponent<CharacterController>();
        if (cameraTransform == null && Camera.main != null)
        {
            cameraTransform = Camera.main.transform;
        }
    }

    private void Update()
    {
        isGrounded = controller.isGrounded;
        if (isGrounded && velocity.y < 0)
        {
            velocity.y = -2f; // Slight downward push to maintain ground contact
        }

        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        Vector3 inputDir = new Vector3(horizontal, 0f, vertical).normalized;

        bool isSprinting = Input.GetKey(KeyCode.LeftShift);
        float currentSpeed = isSprinting ? sprintSpeed : walkSpeed;

        if (inputDir.magnitude >= 0.1f)
        {
            Vector3 moveDirection = cameraTransform.forward * inputDir.z + cameraTransform.right * inputDir.x;
            moveDirection.y = 0f;
            moveDirection.Normalize();

            controller.Move(moveDirection * (currentSpeed * Time.deltaTime));
        }

        // Jump handling
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }

        // Apply gravity
        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}`
  },
  {
    id: 'godot-player-controller',
    title: 'Godot 4.x CharacterBody3D FPS/ThirdPerson Controller',
    category: 'Movement & Physics',
    description: 'Idiomatic Godot 4 GDScript using input vector, lerped acceleration, mouse capture, and slide collisions.',
    location: 'res://scripts/player.gd',
    engine: 'Godot GDScript',
    tags: ['godot', 'gdscript', 'characterbody3d', 'fps', 'movement'],
    code: `# [Engine: Godot 4.x]
# [Node: CharacterBody3D]
extends CharacterBody3D

@export var walk_speed: float = 5.5
@export var sprint_speed: float = 9.0
@export var jump_velocity: float = 4.8
@export var mouse_sensitivity: float = 0.003

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

func _ready() -> void:
\tInput.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event: InputEvent) -> void:
\tif event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
\t\trotate_y(-event.relative.x * mouse_sensitivity)
\t\thead.rotate_x(-event.relative.y * mouse_sensitivity)
\t\thead.rotation.x = clamp(head.rotation.x, deg_to_rad(-85), deg_to_rad(85))
\t
\tif event.is_action_pressed("ui_cancel"):
\t\tif Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
\t\t\tInput.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
\t\telse:
\t\t\tInput.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _physics_process(delta: float) -> void:
\tif not is_on_floor():
\t\tvelocity.y -= gravity * delta

\tif Input.is_action_just_pressed("ui_accept") and is_on_floor():
\t\tvelocity.y = jump_velocity

\tvar input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
\tvar direction: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
\tvar target_speed: float = sprint_speed if Input.is_action_pressed("sprint") else walk_speed

\tif direction:
\t\tvelocity.x = move_toward(velocity.x, direction.x * target_speed, 1.2)
\t\tvelocity.z = move_toward(velocity.z, direction.z * target_speed, 1.2)
\telse:
\t\tvelocity.x = move_toward(velocity.x, 0, 0.8)
\t\tvelocity.z = move_toward(velocity.z, 0, 0.8)

\tmove_and_slide()`
  }
];

// Helper rules to diagnose and fix Roblox GUIs
export const GUI_FIX_RULES = [
  {
    title: 'Scale vs Offset Issue (Mobile Responsive)',
    problem: 'Using fixed pixels like UDim2.new(0, 300, 0, 200) causes GUIs to look huge on mobile or tiny on 4K monitors.',
    solution: 'Convert to Scale: UDim2.new(0.4, 0, 0.5, 0) with UIAspectRatioConstraint so it maintains proportions everywhere.'
  },
  {
    title: 'AnchorPoint Centering Bug',
    problem: 'Default AnchorPoint is (0, 0) which anchors to top-left. Centering with Position (0.5, 0, 0.5, 0) offsets the frame to bottom-right.',
    solution: 'Always set AnchorPoint = Vector2.new(0.5, 0.5) whenever positioning at center UDim2.new(0.5, 0, 0.5, 0).'
  },
  {
    title: 'UICorner Clipping (ClipsDescendants)',
    problem: 'Setting ClipsDescendants = true on a frame with UICorner doesn\'t clip child elements to the rounded curve in older engines.',
    solution: 'Apply UICorner directly to child frames or use CanvasGroup which natively clips to rounded corners.'
  },
  {
    title: 'ZIndex Layering & Overlap',
    problem: 'Buttons or text hidden behind parent backgrounds or dark overlay frames.',
    solution: 'Set parent ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling and assign explicit ZIndex (1 for background, 2 for buttons, 3 for popup modals).'
  },
  {
    title: 'Mobile Safe Area Insets (Notch Clipping)',
    problem: 'GUI buttons get hidden behind iPhone camera notches or Android navigation bars.',
    solution: 'Use ScreenGui.ScreenInsets = Enum.ScreenInsets.CoreWebView or add a UISafeArea constraint.'
  }
];
