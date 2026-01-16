export const JOB_DATA = {
  soldier: {
    name: "ソルジャー",
    role: "frontline_striker",
  stats: { hp: 28, attack: 48, defense: 32, speed: 12, range: 20 },
  attributes: { hp: 28, atk: 48, def: 32, spd: 12, range: 20 },
    skill: {
      name: "braveCharge",
      displayName: "ブレイブチャージ",
      description: "3ターン攻撃力1.5倍。",
      type: "active",
      usage: "once",
      effect: {
        pattern: "line",
        tiles: 3,
        damageMultiplier: 2.0,
        knockbackTiles: 1,
        selfBuff: { durationMs: 4000, speedBonus: 6 }
      }
    },
    affinity: {
      attack: "assassin",
      vulnerable: "lancer",
      strongAgainst: ["assassin"],
      weakAgainst: ["lancer"]
    }
  },
  lancer: {
    name: "ランサー",
    role: "midline_piercer",
  stats: { hp: 22, attack: 28, defense: 22, speed: 30, range: 38 },
  attributes: { hp: 22, atk: 28, def: 22, spd: 30, range: 38 },
    skill: {
      name: "reachBreak",
      displayName: "リーチブレイク",
      description: "周辺10マスへ貫通攻撃。",
      type: "active",
      usage: "cooldown",
      cooldownMs: 12000,
      effect: {
        area: { shape: "cone", radius: 2, angle: 60 },
        damageMultiplier: 1.5,
        debuff: { defenseMultiplier: 0.8, durationMs: 5000 }
      }
    },
    affinity: {
      attack: "guardian",
      vulnerable: "assassin",
      strongAgainst: ["guardian"],
      weakAgainst: ["assassin"]
    }
  },
  archer: {
    name: "アーチャー",
    role: "ranged_dps",
  stats: { hp: 18, attack: 18, defense: 20, speed: 30, range: 54 },
  attributes: { hp: 18, atk: 18, def: 20, spd: 30, range: 54 },
    skill: {
      name: "multiShot",
      displayName: "マルチショット",
      description: "射程内の敵に、それぞれ70%威力の攻撃。",
      type: "active",
      usage: "cooldown",
      cooldownMs: 14000,
      effect: {
        targets: 3,
        damageMultiplier: 1.3,
        selection: "closest"
      }
    },
    affinity: {
      attack: "summoner",
      vulnerable: "scout",
      strongAgainst: ["summoner"],
      weakAgainst: ["scout"]
    }
  },
  mage: {
    name: "メイジ",
    role: "burst_caster",
  stats: { hp: 26, attack: 32, defense: 24, speed: 28, range: 30 },
  attributes: { hp: 26, atk: 32, def: 24, spd: 28, range: 30 },
    skill: {
      name: "elementalBurst",
      displayName: "エレメンタルバースト",
      description: "半径2マスに3ターン攻撃力20の範囲継続ダメージ。",
      type: "active",
      usage: "once",
      effect: {
        area: { shape: "circle", radius: 2 },
        damageMultiplier: 2.2,
        elemental: ["fire", "ice", "lightning"]
      }
    },
    affinity: {
      attack: "guardian",
      vulnerable: "archer",
      strongAgainst: ["guardian"],
      weakAgainst: ["archer"]
    }
  },
  healer: {
    name: "ヒーラー",
    role: "support_healer",
  stats: { hp: 18, attack: 18, defense: 26, speed: 40, range: 38 },
  attributes: { hp: 18, atk: 18, def: 26, spd: 40, range: 38 },
    skill: {
      name: "medica",
      displayName: "メディカ",
      description: "味方全員を即時20回復（全体回復）",
      type: "active",
      usage: "cooldown",
      cooldownMs: 10000,
      effect: {
        target: "ally",
        healAmount: 150,
        cleanse: true,
        regen: { amount: 80, durationMs: 5000 }
      }
    },
    affinity: {
      vulnerable: "assassin",
      strongAgainst: ["mage"],
      weakAgainst: ["assassin"]
    }
  },
  guardian: {
    name: "ガーディアン",
    role: "tank",
  stats: { hp: 36, attack: 14, defense: 54, speed: 8, range: 28 },
  attributes: { hp: 36, atk: 14, def: 54, spd: 8, range: 28 },
    skill: {
      name: "fortress",
      displayName: "フォートレス",
      description: "4ターン防御力1.4倍。",
      type: "active",
      usage: "once",
      effect: {
        tauntRadius: 2,
        durationMs: 8000,
        damageTakenMultiplier: 0.6
      }
    },
    affinity: {
      attack: "soldier",
      vulnerable: "mage",
      strongAgainst: ["soldier"],
      weakAgainst: ["mage"]
    }
  },
  assassin: {
    name: "アサシン",
    role: "melee_burst",
  stats: { hp: 18, attack: 40, defense: 14, speed: 36, range: 32 },
  attributes: { hp: 18, atk: 40, def: 14, spd: 36, range: 32 },
    skill: {
      name: "shadowStep",
      displayName: "シャドウステップ",
      description: "瞬時に2マス移動し背後から200%ダメージ。",
      type: "active",
      usage: "cooldown",
      cooldownMs: 15000,
      effect: {
        teleport: { range: 4, behindTarget: true },
        damageMultiplier: 2.2,
        debuff: { type: "stun", durationMs: 2000 }
      }
    },
    affinity: {
      attack: "lancer",
      vulnerable: "guardian",
      strongAgainst: ["lancer"],
      weakAgainst: ["guardian"]
    }
  },
  engineer: {
    name: "エンジニア",
    role: "utility_artificer",
  stats: { hp: 20, attack: 16, defense: 30, speed: 30, range: 44 },
  attributes: { hp: 20, atk: 16, def: 30, spd: 30, range: 44 },
    skill: {
      name: "deployTurret",
      displayName: "タレット展開",
      description: "3ターン射程20マス、攻撃力15の砲台設置。",
      type: "active",
      usage: "cooldown",
      cooldownMs: 18000,
      effect: {
        summon: {
          type: "turret",
          durationMs: 15000,
          attackIntervalMs: 1000,
          damageMultiplier: 0.8,
          range: 20
        }
      }
    },
    affinity: {
      attack: "scout",
      vulnerable: "summoner",
      strongAgainst: ["scout"],
      weakAgainst: ["summoner"]
    }
  },
  summoner: {
    name: "サモナー",
    role: "control_summoner",
  stats: { hp: 26, attack: 24, defense: 22, speed: 26, range: 42 },
  attributes: { hp: 26, atk: 24, def: 22, spd: 26, range: 42 },
    skill: {
      name: "miniOnCall",
      displayName: "チャンピオンコール",
      description: "HP100・攻撃40のチャンピオン1体を5ターン召喚。",
      type: "active",
      usage: "cooldown",
      cooldownMs: 20000,
      effect: {
        summon: {
          count: 2,
          durationMs: 10000,
          attackIntervalMs: 1200,
          damageMultiplier: 0.9,
          range: 18
        }
      }
    },
    affinity: {
      attack: "engineer",
      vulnerable: "archer",
      strongAgainst: ["engineer"],
      weakAgainst: ["archer"]
    }
  },
  scout: {
    name: "スカウト",
    role: "recon_striker",
  stats: { hp: 14, attack: 18, defense: 12, speed: 56, range: 40 },
  attributes: { hp: 14, atk: 18, def: 12, spd: 56, range: 40 },
    skill: {
      name: "reconPulse",
      displayName: "リコンパルス",
      description: "2ターンステルス化（敵に攻撃されない、移動時に敵をすり抜ける）",
      type: "active",
      usage: "cooldown",
      cooldownMs: 12000,
      effect: {
        revealRadius: 4,
        revealDurationMs: 6000,
        damageMultiplier: 1.6
      }
    },
    affinity: {
      attack: "archer",
      vulnerable: "engineer",
      strongAgainst: ["archer"],
      weakAgainst: ["engineer"]
    }
  },
  sumo: {
    name: "相撲レスラー",
    role: "frontline_heavy",
  stats: { hp: 56, attack: 30, defense: 30, speed: 8, range: 16 },
  attributes: { hp: 56, atk: 30, def: 30, spd: 8, range: 16 },
    skill: {
      name: "dohyo_breaker",
      displayName: "土俵轟砕",
      description: "半径2マス範囲の敵全体に攻撃＋ノックバック4マス。",
      type: "active",
      usage: "once",
      effect: {
        area: { shape: "circle", radius: 1.5 },
        damageMultiplier: 2.5,
        knockbackTiles: 2,
        selfBuff: { durationMs: 8000, damageTakenMultiplier: 0.7 }
      }
    },
    affinity: {
      strongAgainst: ["assassin"],
      weakAgainst: ["mage"]
    }
  }
};