import React, { useState } from 'react';
import { 
  Gamepad2, 
  Code, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';

interface GameEngineHubProps {
  onAskGemini: (prompt: string) => void;
}

export const GameEngineHub: React.FC<GameEngineHubProps> = ({ onAskGemini }) => {
  const [activeEngine, setActiveEngine] = useState<'roblox' | 'unity' | 'godot' | 'unreal'>('roblox');
  const [selectedMechanic, setSelectedMechanic] = useState<string>('movement');
  const [copied, setCopied] = useState(false);

  const mechanics = [
    { id: 'movement', title: 'Player Movement & Jump Controller' },
    { id: 'health', title: 'Health & Damage Taking System' },
    { id: 'inventory', title: 'Item Collection & Inventory' },
    { id: 'save', title: 'Save & Load Persistence' },
    { id: 'raycast', title: 'Hitscan Raycast Weapon' },
  ];

  const engineData: Record<string, Record<string, { lang: string; file: string; code: string }>> = {
    movement: {
      roblox: {
        lang: 'Luau',
        file: 'StarterPlayerScripts > LocalScript (PlayerMovement)',
        code: `-- [Roblox Studio: StarterPlayerScripts > LocalScript]
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local NORMAL_SPEED = 16
local SPRINT_SPEED = 28

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.LeftShift then
        humanoid.WalkSpeed = SPRINT_SPEED
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        humanoid.WalkSpeed = NORMAL_SPEED
    end
end)`
      },
      unity: {
        lang: 'C#',
        file: 'Assets/Scripts/PlayerController.cs',
        code: `// [Unity 2022+ / 6 - C#]
using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float walkSpeed = 6f;
    public float sprintSpeed = 11f;
    public float jumpHeight = 2.4f;
    public float gravity = -20f;

    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;

    void Start() => controller = GetComponent<CharacterController>();

    void Update()
    {
        isGrounded = controller.isGrounded;
        if (isGrounded && velocity.y < 0) velocity.y = -2f;

        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        bool isSprinting = Input.GetKey(KeyCode.LeftShift);

        float speed = isSprinting ? sprintSpeed : walkSpeed;
        Vector3 move = transform.right * x + transform.forward * z;
        controller.Move(move * speed * Time.deltaTime);

        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }

        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}`
      },
      godot: {
        lang: 'GDScript',
        file: 'res://scripts/player.gd',
        code: `# [Godot 4.x - GDScript 2.0]
extends CharacterBody3D

const WALK_SPEED = 5.5
const SPRINT_SPEED = 9.5
const JUMP_VELOCITY = 4.8
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta):
\tif not is_on_floor():
\t\tvelocity.y -= gravity * delta

\tif Input.is_action_just_pressed("ui_accept") and is_on_floor():
\t\tvelocity.y = JUMP_VELOCITY

\tvar input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
\tvar direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
\tvar speed = SPRINT_SPEED if Input.is_action_pressed("sprint") else WALK_SPEED

\tif direction:
\t\tvelocity.x = direction.x * speed
\t\tvelocity.z = direction.z * speed
\telse:
\t\tvelocity.x = move_toward(velocity.x, 0, speed)
\t\tvelocity.z = move_toward(velocity.z, 0, speed)

\tmove_and_slide()`
      },
      unreal: {
        lang: 'C++',
        file: 'Source/MyGame/MyCharacter.cpp',
        code: `// [Unreal Engine 5 - C++]
#include "MyCharacter.h"
#include "GameFramework/CharacterMovementComponent.h"

AMyCharacter::AMyCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    GetCharacterMovement()->MaxWalkSpeed = 600.f;
    GetCharacterMovement()->JumpZVelocity = 650.f;
    GetCharacterMovement()->AirControl = 0.35f;
}

void AMyCharacter::Move(const FVector2D& Value)
{
    if (Controller != nullptr)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);

        const FVector ForwardDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        const FVector RightDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);

        AddMovementInput(ForwardDirection, Value.Y);
        AddMovementInput(RightDirection, Value.X);
    }
}`
      }
    },
    health: {
      roblox: {
        lang: 'Luau',
        file: 'ServerScriptService > Script (DamageSystem)',
        code: `local Players = game:GetService("Players")

local function onPlayerSpawned(player, character)
    local humanoid = character:WaitForChild("Humanoid")
    humanoid.MaxHealth = 100
    humanoid.Health = 100

    humanoid.Died:Connect(function()
        print(player.Name .. " was eliminated!")
        task.wait(3)
        player:LoadCharacter() -- Respawn
    end)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
        onPlayerSpawned(player, char)
    end)
end)`
      },
      unity: {
        lang: 'C#',
        file: 'Assets/Scripts/Health.cs',
        code: `using UnityEngine;
using UnityEngine.Events;

public class Health : MonoBehaviour
{
    public float maxHealth = 100f;
    public float currentHealth;
    public UnityEvent<float> OnHealthChanged;
    public UnityEvent OnDeath;

    void Awake() => currentHealth = maxHealth;

    public void TakeDamage(float amount)
    {
        currentHealth = Mathf.Clamp(currentHealth - amount, 0, maxHealth);
        OnHealthChanged?.Invoke(currentHealth / maxHealth);
        if (currentHealth <= 0) OnDeath?.Invoke();
    }
}`
      },
      godot: {
        lang: 'GDScript',
        file: 'res://scripts/health_component.gd',
        code: `extends Node
class_name HealthComponent

signal health_changed(new_health, max_health)
signal died

@export var max_health: float = 100.0
var current_health: float

func _ready():
\tcurrent_health = max_health

func take_damage(amount: float):
\tcurrent_health = clamp(current_health - amount, 0.0, max_health)
\thealth_changed.emit(current_health, max_health)
\tif current_health <= 0:
\t\tdied.emit()`
      },
      unreal: {
        lang: 'C++',
        file: 'Source/MyGame/HealthComponent.cpp',
        code: `#include "HealthComponent.h"

UHealthComponent::UHealthComponent()
{
    MaxHealth = 100.f;
    CurrentHealth = MaxHealth;
}

void UHealthComponent::ApplyDamage(float DamageAmount)
{
    CurrentHealth = FMath::Clamp(CurrentHealth - DamageAmount, 0.f, MaxHealth);
    OnHealthChanged.Broadcast(CurrentHealth, MaxHealth);
    if (CurrentHealth <= 0.f)
    {
        OnDeath.Broadcast();
    }
}`
      }
    }
  };

  const currentSnippet = 
    engineData[selectedMechanic]?.[activeEngine] || 
    engineData['movement'][activeEngine];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#292215] via-[#211d17] to-[#1a1c22] border border-[#534327] p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#fdcb6e]/20 text-[#fdcb6e] border border-[#fdcb6e]/40">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Multi-Game Engine Code Hub
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#3d3319] text-[#ffeaa7] text-xs font-semibold border border-[#6d5b2b]">
              Roblox • Unity • Godot • Unreal
            </span>
          </div>
          <p className="text-xs text-[#a0a0a8] mt-1.5 max-w-2xl leading-relaxed">
            Generate and convert game logic seamlessly across Roblox Studio (Luau), Unity (C#), Godot 4 (GDScript), and Unreal Engine 5 (C++).
          </p>
        </div>

        <button
          onClick={() => onAskGemini(`How do I convert a Roblox Studio script into Unity C# or Godot 4? Can you show an example?`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fdcb6e] to-[#e17055] text-black font-bold text-xs transition-all hover:opacity-95 self-start sm:self-auto shrink-0 shadow-lg shadow-[#fdcb6e]/20"
        >
          <Zap className="w-4 h-4 text-black fill-black" />
          <span>Ask What's Up AI Cross-Engine</span>
        </button>
      </div>

      {/* Engine Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'roblox', name: 'Roblox Studio', lang: 'Luau 5.1', color: '#a55eea' },
          { id: 'unity', name: 'Unity Engine', lang: 'C# 10', color: '#388bfd' },
          { id: 'godot', name: 'Godot 4.x', lang: 'GDScript 2.0', color: '#00cec9' },
          { id: 'unreal', name: 'Unreal Engine 5', lang: 'C++ 20', color: '#fdcb6e' },
        ].map((eng) => (
          <button
            key={eng.id}
            onClick={() => setActiveEngine(eng.id as any)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeEngine === eng.id
                ? 'bg-[#232128] border-white/40 shadow-xl ring-2 ring-white/10'
                : 'bg-[#18191d] border-[#2b2d32] hover:border-white/20'
            }`}
          >
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>{eng.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono" style={{ color: eng.color }}>
                {eng.lang}
              </span>
            </div>
            <p className="text-[10px] text-[#8e8e93] mt-1">Native game framework</p>
          </button>
        ))}
      </div>

      {/* Mechanic Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[#8e8e93] font-semibold shrink-0">Mechanic:</span>
        {mechanics.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMechanic(m.id)}
            className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
              selectedMechanic === m.id
                ? 'bg-[#2e261a] border-[#fdcb6e] text-[#ffeaa7] font-semibold'
                : 'bg-[#1e1f20] border-[#2e3034] text-[#8e8e93] hover:text-white'
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {/* Code Display Area */}
      <div className="bg-[#161719] border border-[#2e3034] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#202124] p-4 border-b border-[#2d3034] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#fdcb6e]" />
              <span>{currentSnippet.file}</span>
            </h3>
            <span className="text-[11px] text-[#8e8e93]">Language: {currentSnippet.lang}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2d30] hover:bg-[#34373c] text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#55efc4]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => onAskGemini(`Explain this ${currentSnippet.lang} code and help me integrate it into my game:\n\n\`\`\`\n${currentSnippet.code}\n\`\`\``)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#fdcb6e] hover:bg-[#ffeaa7] text-black text-xs font-bold transition-all shadow"
            >
              <Send className="w-3 h-3 text-black" />
              <span>Ask AI About Script</span>
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-xs overflow-x-auto text-[#d4d4d4] leading-relaxed max-h-[500px] select-text">
          <pre className="tab-4">
            <code>{currentSnippet.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
