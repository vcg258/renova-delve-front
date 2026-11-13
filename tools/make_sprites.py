# -*- coding: utf-8 -*-
"""Pixel sprite authoring: hand-drawn 16x16 grids -> sprites.json + preview PNG.

Rows of length 8 are the left half and get mirrored; rows of length 16 are used as-is.
'.' is transparent, every other char is looked up in the sprite's palette.
"""
import json
import math
import struct
import sys
import zlib

K = '#140e1c'  # outline

SPRITES = {}


def add(name, rows, palette, variants=None):
    assert len(rows) == 16, (name, len(rows))
    full = []
    for r in rows:
        assert len(r) in (8, 16), (name, r, len(r))
        full.append(r + r[::-1] if len(r) == 8 else r)
    pal = {'k': K}
    pal.update(palette)
    used = set(''.join(full)) - {'.'}
    missing = used - set(pal)
    assert not missing, (name, missing)
    SPRITES[name] = {'rows': full, 'palette': pal, 'variants': variants or {}}


# ------------------------------------------------------------------ monsters
add('angel', [
    "......gg",
    ".....g..",
    "......kk",
    ".....kss",
    ".....kws",
    "..k..kss",
    ".kak..kk",
    "kaaAkkbb",
    "kaaaAkbc",
    "kaaaAkbc",
    ".kaaAkbc",
    ".kaAkkbc",
    "..kk.kbc",
    ".....kbc",
    "....kbbc",
    "....kkkk",
], {'g': '#f0cf62', 's': '#f1dcc0', 'w': '#6fd8ff', 'a': '#f6f1e2', 'A': '#b9b2a2', 'b': '#cfc7b2', 'c': '#f7f2e4'},
    variants={
        'fallen': {'g': '#5a4a3a', 'a': '#3a3440', 'A': '#221d28', 'b': '#4a4452', 'c': '#6a6474', 'w': '#e0483c', 's': '#b9a9a0'},
        'judge': {'b': '#b8902e', 'c': '#f0cf62', 'w': '#ffffff'},
        'choir': {'s': '#c9c2b0', 'w': '#b05ae5', 'a': '#d6d0c2', 'A': '#8f8878', 'g': '#8a7a4a'},
    })

add('archangel', [
    "...g..gg",
    "..g..g..",
    ".k....kk",
    "kak..kss",
    "kaak.kws",
    "kaaakkss",
    ".kaaAkkk",
    "kkaaAkgg",
    "kaeaAkbc",
    "kaaaAkbc",
    ".kaAkkbc",
    "kkakkkbc",
    "kaaAkkbc",
    "kaeAk.kc",
    ".kak..kc",
    "..k...kk",
], {'g': '#f0cf62', 's': '#f6ead2', 'w': '#ffffff', 'a': '#fbf7ea', 'A': '#c4bca8', 'b': '#d9cfae', 'c': '#fffbe8', 'e': '#e0483c'})

add('imp', [
    "...h....",
    "...hh.kk",
    "....kkdd",
    "...kdddd",
    "...kdydd",
    "...kdddd",
    "k...kdkk",
    "kk..kddd",
    "kWk.kdDd",
    "kWWkkdDd",
    "kWWWkdDd",
    ".kWkkdDd",
    "..k.kddd",
    "....kdk.",
    "...kkdk.",
    "...kkkk.",
], {'h': '#e8d9b0', 'd': '#b23a30', 'D': '#74201c', 'y': '#ffd34a', 'W': '#4a1820'},
    variants={
        'goblin': {'d': '#6f9a48', 'D': '#44682c', 'W': '#3a2a1c', 'h': '#44682c', 'y': '#ffe36a'},
        'contract': {'d': '#7a2440', 'D': '#4a1028', 'W': '#1c1020', 'y': '#ff7a5a', 'h': '#f0cf62'},
    })

add('demonlord', [
    ".h....g.",
    ".hh..ggg",
    "..hhkggg",
    "...hkddd",
    "...kdydd",
    "...kdddd",
    "..kkkdkk",
    ".kcckddd",
    "kcCckddr",
    "kcCckdDd",
    "kcCckdDd",
    "kcCckdDd",
    "kcCckkdd",
    "kcCcckd.",
    "kcccckk.",
    "kkkkkk..",
], {'h': '#d8c9a0', 'g': '#f0cf62', 'd': '#8a2436', 'D': '#521222', 'y': '#ffcf40', 'c': '#241432', 'C': '#4a2a5c', 'r': '#ff5a4a'},
    variants={
        'tempter': {'d': '#c9a9b8', 'D': '#8a6a7c', 'c': '#3a0c14', 'C': '#8a1c26', 'g': '#1c1020', 'y': '#ff4a6a'},
        'shadow': {'d': '#2a2040', 'D': '#161024', 'c': '#0e0a16', 'C': '#241a38', 'g': '#4a3a6a', 'h': '#4a3a6a', 'y': '#b05ae5', 'r': '#b05ae5'},
    })

add('knight', [
    "......pp",
    ".....kpp",
    "....kkkk",
    "...kmmll",
    "...kmvvk",
    "...kmmml",
    "..kkkkkk",
    ".kmmkmml",
    "kmlmkmMl",
    "kmmmkmMl",
    "kMmMkmMl",
    ".kkkkmml",
    "....kmMk",
    "....kmMk",
    "...kkmMk",
    "...kkkkk",
], {'p': '#a8322c', 'm': '#8a93a3', 'M': '#555d6c', 'l': '#c9d2de', 'v': '#e0483c'},
    variants={
        'captain': {'m': '#b8902e', 'M': '#7a5c1a', 'l': '#f0cf62', 'p': '#f6f1e2', 'v': '#6fd8ff'},
        'ghost': {'m': '#5a7aa8', 'M': '#34507a', 'l': '#9ac0f0', 'p': '#6fd8ff', 'v': '#e8f6ff'},
        'rusted': {'m': '#7a6652', 'M': '#4e3e30', 'l': '#a08a70', 'p': '#4e3e30', 'v': '#9acd5a'},
        'vine': {'m': '#5e7458', 'M': '#3a4c36', 'l': '#8aa878', 'p': '#3f7a3a', 'v': '#c84a8a'},
    })

add('skeleton', [
    "........",
    ".....kkk",
    "....kooo",
    "....kooo",
    "....kkeo",
    "....kooo",
    ".....kok",
    "......kk",
    "..kkkkoo",
    ".kok.kOo",
    ".kok.koO",
    ".kok.kOo",
    "..k.kkoo",
    "....kok.",
    "....kok.",
    "...kkok.",
], {'o': '#e6dfc8', 'O': '#a59c84', 'e': '#6fd8ff'},
    variants={'lord': {'o': '#d9cfae', 'O': '#8a7a5a', 'e': '#b05ae5'}})

add('zombie', [
    "........",
    ".....kkk",
    "....kzzz",
    "....kzez",
    "....kzzz",
    "....kZrr",
    ".....kkk",
    "..kkkccC",
    ".kzkkccC",
    ".kzk.kcC",
    "kzk..kcC",
    "kzk..kcc",
    ".k...kcr",
    "....kzk.",
    "....kZk.",
    "...kkkk.",
], {'z': '#8aa474', 'Z': '#5a7450', 'c': '#5a4a3a', 'C': '#7a6650', 'e': '#f0e870', 'r': '#a8322c'},
    variants={
        'flesh': {'z': '#b86a64', 'Z': '#7a3a38', 'c': '#7a3a38', 'C': '#a85a54', 'e': '#ffffff', 'r': '#e8d9b0'},
        'servant': {'c': '#2a2a34', 'C': '#e6dfc8'},
    })

add('mage', [
    ".......k",
    "......kh",
    ".....khh",
    "....khHh",
    "..kkkggg",
    "...kksss",
    "....kses",
    "....kkss",
    "...kkhhh",
    "..khkhHg",
    ".khhkhHg",
    ".khkkhHh",
    ".kk.khHh",
    "....khHh",
    "...khhhh",
    "...kkkkk",
], {'h': '#3d2a6b', 'H': '#5d44a0', 's': '#e3c9a8', 'e': '#c9a0ff', 'g': '#f0cf62'},
    variants={
        'fire': {'h': '#7a1c1c', 'H': '#b23a30', 'e': '#ffb03c', 'g': '#ff9a3c'},
        'ice': {'h': '#2a4a7a', 'H': '#4a7ab8', 'e': '#e8f6ff', 'g': '#9ad8ff', 's': '#c9d8e8'},
        'blood': {'h': '#3a0c14', 'H': '#6e1420', 'e': '#ff4a4a', 'g': '#a8322c', 's': '#d9c0c0'},
        'priest': {'h': '#1c1420', 'H': '#342840', 'e': '#e0483c', 'g': '#8a7a4a', 's': '#b9a9a0'},
    })

add('wraith', [
    "........",
    ".....kkk",
    "....kwww",
    "...kwwww",
    "...kweew",
    "...kwwww",
    "...kwwee",
    "..kwwwww",
    ".kwWwwww",
    ".kwWwwww",
    "kwWWwwww",
    "kwWkwWww",
    ".kk.kWww",
    "....kWwW",
    ".....kWk",
    "......k.",
], {'w': '#b8c4e0', 'W': '#7482a8', 'e': '#1a1030'},
    variants={
        'shadow': {'w': '#3a2c58', 'W': '#221838', 'e': '#c070ff'},
        'guardian': {'w': '#8ad0c0', 'W': '#4a8a80', 'e': '#f0cf62'},
    })

add('wolf', [
    "................",
    "................",
    "...........k.k..",
    "..........kfkfk.",
    "..........kffffk",
    "kk.......kffeffk",
    "kfk..kkkkkfffttk",
    ".kfkkfffffffkkk.",
    "..kflfffffffk...",
    "..kfffffffffk...",
    "..kfFfffffFfk...",
    "..kfkkkkkkfFk...",
    "..kFk....kFk....",
    "..kFk....kFk....",
    ".kkFk...kkFk....",
    ".kkkk...kkkk....",
], {'f': '#6b6470', 'F': '#3f3a46', 'l': '#9a93a0', 'e': '#ffcf40', 't': '#ffffff'},
    variants={
        'rat': {'f': '#7a6652', 'F': '#4e3e30', 'l': '#a08a70', 'e': '#ff5a4a'},
        'hound': {'f': '#5a3a34', 'F': '#341c1a', 'l': '#e6dfc8', 'e': '#ff5a4a'},
    })

add('spider', [
    "........",
    "L.......",
    ".L..L...",
    "..L..L..",
    "...L.kkk",
    "LL..kbBb",
    "..LLkbeb",
    "...kbbbb",
    "LLLkbBpb",
    "...kbbBp",
    ".LLkbpbb",
    "L..kbbBb",
    "..L.kbbb",
    ".L...kkk",
    "L.......",
    "........",
], {'b': '#3a2c48', 'B': '#5e4a74', 'p': '#c070ff', 'e': '#ff5a4a', 'L': '#7a6694'},
    variants={'swarm': {'b': '#4a3a24', 'B': '#6e5a3a', 'p': '#e0483c', 'e': '#ffd34a', 'L': '#8a7450'},
              'crab': {'b': '#8a3a2c', 'B': '#b85a44', 'p': '#e8d9b0', 'e': '#1a1030', 'L': '#b85a44'}})

add('slime', [
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    ".....kkk",
    "...kklgg",
    "..kglggg",
    ".kgggkgg",
    ".kgggkgg",
    "kggggggg",
    "kgGggggg",
    "kGGGgggg",
    ".kkGGGGG",
    "...kkkkk",
], {'g': '#6fbf5a', 'G': '#3f8a3a', 'l': '#c6f4a8'},
    variants={'sewage': {'g': '#7a7a3a', 'G': '#4e4e22', 'l': '#b8b86a'},
              'alchemy': {'g': '#a855c8', 'G': '#6a2a8a', 'l': '#e0a8ff'}})

add('plant', [
    "....k.kk",
    "...kfkff",
    "..kffkfm",
    "..kfffmm",
    "...kftmm",
    "....kkfm",
    ".k...kkk",
    "kvk...kv",
    ".kvk..kV",
    "..kvkkkv",
    "...kvvVv",
    ".kk.kkvV",
    "kvvk.kvv",
    ".kkvkkVv",
    "..kvvvvv",
    "...kkkkk",
], {'v': '#3f7a3a', 'V': '#6fae52', 't': '#f6f1e2', 'm': '#a8322c', 'f': '#c84a8a'},
    variants={'thorn': {'f': '#5e7458', 'm': '#6e1420', 'v': '#4a5a34', 'V': '#7a8a4a'}})

add('dragon', [
    "..h.....",
    "..hh....",
    "k..hkkkk",
    "kk.kdddd",
    "kDkkdydd",
    "kDDkdddd",
    "kDlDkddl",
    "kDlDkdkd",
    "kDlDDkdf",
    "kDlDkkff",
    "kDDkkdff",
    ".kkkddkf",
    "..kdDdlk",
    "..kdDdlk",
    "..kkdddk",
    "...kkkk.",
], {'h': '#d8c9a0', 'd': '#5a3a8a', 'D': '#38225c', 'l': '#8a66c8', 'y': '#ffcf40', 'f': '#d08aff'})

add('golem', [
    "........",
    "....kkkk",
    "...kslls",
    "...ksess",
    "...kssss",
    ".kkkkkkk",
    "ksslkssl",
    "kssSksms",
    "kssSkssl",
    "kSsSksSs",
    "kssSkssl",
    "kssk.kss",
    "ksSk.ksS",
    ".kk..kss",
    "....ksSs",
    "....kkkk",
], {'s': '#7c7a82', 'S': '#4e4c56', 'l': '#a9a7b0', 'e': '#6fd8ff', 'm': '#5a8a4a'},
    variants={'altar': {'s': '#6e2a2a', 'S': '#421616', 'l': '#a84a44', 'e': '#ffd34a', 'm': '#e0483c'},
              'gargoyle': {'s': '#5a5a6e', 'S': '#36364a', 'l': '#8a8aa4', 'e': '#e0483c', 'm': '#36364a'}})

add('vampire', [
    "........",
    ".....kkk",
    "....khhh",
    "....khss",
    "....kses",
    "....ksss",
    ".k...kst",
    "kck.kkkk",
    "kcCkkcww",
    "kcCkccwC",
    "kcCkccwC",
    "kcCCkcww",
    "kccCkccc",
    ".kcckccc",
    "..kkkccc",
    "....kkkk",
], {'c': '#2a1020', 'C': '#a8322c', 's': '#e6e0ea', 'h': '#1c1420', 'e': '#e0483c', 'w': '#f6f1e2', 't': '#ffffff'},
    variants={'noble': {'c': '#1c1030', 'C': '#b8902e', 'h': '#d9d2e0'}})

add('rogue', [
    "........",
    "......kk",
    "....kkhh",
    "...khhHH",
    "...khsss",
    "...khses",
    "...khsss",
    "....kkhh",
    "..kkhhhH",
    ".khhkhhH",
    ".khhkhhH",
    "b.kkkhhH",
    "b...khhh",
    "k...khk.",
    "....khk.",
    "...kkkk.",
], {'h': '#3a3a44', 'H': '#5a5a68', 's': '#1c1420', 'e': '#ffcf40', 'b': '#c9d2de'},
    variants={
        'pilgrim': {'h': '#d9d2c0', 'H': '#f6f1e2', 's': '#b9a9a0', 'e': '#f6f1e2', 'b': '#ff9a3c'},
        'archer': {'h': '#4a5a34', 'H': '#6a7a4a', 'e': '#9acd5a', 'b': '#a08a70'},
        'vagrant': {'h': '#5a4a3a', 'H': '#7a6650', 'e': '#f0e870', 'b': '#8a93a3'},
        'assassin': {'h': '#1c1420', 'H': '#342840', 'e': '#c070ff', 'b': '#c070ff'},
    })

# ------------------------------------------------------------------ skills (full 16 wide)
add('sword', [
    "..............kk",
    ".............kbk",
    "............kbbk",
    "...........kbBk.",
    "..........kbBk..",
    ".........kbBk...",
    "........kbBk....",
    ".......kbBk.....",
    "..kk..kbBk......",
    "..kgkkbBk.......",
    "...kgkBk........",
    "....kggk........",
    "...khkgk........",
    "..khk.kgk.......",
    ".khk...kk.......",
    ".kk.............",
], {'b': '#e6edf5', 'B': '#8a93a3', 'g': '#f0cf62', 'h': '#7a5232'},
    variants={
        'poison': {'b': '#b6f09a', 'B': '#3f8a3a', 'g': '#5a7450', 'h': '#2a2030'},
        'bleed': {'b': '#ff8a7d', 'B': '#a8322c', 'g': '#4a1820', 'h': '#2a1020'},
    })

add('hammer', [
    "................",
    ".....kkkkkk.....",
    "....kmmmmmmk.x..",
    "....kmllllmk....",
    "....kmlmmlmk..x.",
    "....kmmmmmmk....",
    ".x..kMMMMMMk....",
    ".....kkhhkk.....",
    ".......hhk......",
    "......khhk......",
    "......khhk..x...",
    "..x...khhk......",
    "......khhk......",
    "......khhk......",
    "......kggk......",
    ".......kk.......",
], {'m': '#8a93a3', 'M': '#555d6c', 'l': '#c9d2de', 'h': '#7a5232', 'g': '#f0cf62', 'x': '#00000000'},
    variants={'stun': {'x': '#ffe36a', 'm': '#b8902e', 'M': '#7a5c1a', 'l': '#f0cf62'}})

add('axe', [
    "................",
    "......kkkk......",
    "....kkbbbbk.kk..",
    "...kbbbbbbBkhhk.",
    "..kbbbbbbBBkhk..",
    "..kblbbbBBkhhk..",
    "..kbllbBBkkhk...",
    "..kbbbBBk.khk...",
    "...kBBBk.khhk...",
    "....kkk..khk....",
    "........khhk....",
    "........khk.....",
    ".......khhk.....",
    ".......khk......",
    "......khhk......",
    "......kkk.......",
], {'b': '#c9d2de', 'B': '#6e7686', 'l': '#ffffff', 'h': '#7a5232'})

add('skullflame', [
    "..f....f",
    ".fF...fF",
    ".fFf.fFF",
    "fFFfkkkk",
    "fFykoooo",
    "fFykoooo",
    ".fkokkoo",
    ".fkokkoo",
    ".fFkoooo",
    "..fkooko",
    "..fFkooo",
    "...fkoko",
    "...fkkkk",
    "....fFFf",
    ".....ff.",
    "........",
], {'f': '#e0483c', 'F': '#ff9a3c', 'y': '#ffd34a', 'o': '#e6dfc8'})


def procedural(name, fn, palette, variants=None):
    rows = []
    for y in range(16):
        rows.append(''.join(fn(x, y) for x in range(16)))
    add(name, rows, palette, variants)


def fireball(x, y):
    # 오른쪽 위로 날아가는 불덩이 + 왼쪽 아래로 흩어지는 꼬리
    cx, cy = 10.0, 5.5
    d = math.hypot(x - cx, y - cy)
    if d < 1.8:
        return 'y'
    if d < 3.2:
        return 'o'
    if d < 4.3:
        return 'r'
    if d < 5.2:
        return 'k'
    # tail along the (-1, +1) diagonal
    t = ((cx - x) + (y - cy)) / 2.0          # distance along the tail
    off = abs((cx - x) - (y - cy)) / 2.0      # distance from the tail axis
    if 3.0 < t < 8.5:
        width = 2.6 - (t - 3.0) * 0.42
        if off < width - 1.0 and (x + 2 * y) % 3 != 0:
            return 'o' if t < 5.5 else 'r'
        if off < width and (x * 3 + y) % 4 != 0:
            return 'r'
    return '.'


def spin(x, y):
    # 회전 베기: 한쪽이 끊긴 초승달 궤적
    cx, cy = 7.5, 7.5
    d = math.hypot(x - cx, y - cy)
    ang = (math.degrees(math.atan2(y - cy, x - cx)) + 360) % 360
    if 20 < ang < 75:
        return '.'
    thick = 1.0 + 1.6 * (((ang - 75) % 360) / 305.0)   # 궤적이 갈수록 두꺼워진다
    r = 5.6
    if abs(d - r) < thick * 0.5:
        return 'w' if ((ang - 75) % 360) > 200 else 's'
    if abs(d - r) < thick * 0.5 + 0.9:
        return 'k'
    return '.'


def slashes(x, y):
    # 세 줄의 사선 베기 자국 (가운데가 굵고 양 끝이 가늘다)
    best = '.'
    for i, c in enumerate((9, 15, 21)):
        s = x + y - c                 # 사선으로부터의 거리
        t = (x - y + 8) / 16.0        # 사선 위의 위치 0..1
        if not (0.12 + i * 0.03 < t < 0.92 - (2 - i) * 0.03):
            continue
        half = 1.25 * math.sin(max(0.0, min(1.0, (t - 0.1) / 0.84)) * math.pi)
        if abs(s) <= half * 0.55:
            return 'w'
        if abs(s) <= half:
            best = 's'
        elif abs(s) <= half + 1 and best == '.':
            best = 'k'
    return best


procedural('fireball', fireball, {'y': '#fff3b0', 'o': '#ffb03c', 'r': '#e0483c'})
procedural('spin', spin, {'w': '#ffffff', 's': '#9ac0f0'})
procedural('slashes', slashes, {'w': '#ffffff', 's': '#c9d2de'},
           variants={'bleed': {'w': '#ffb0a8', 's': '#e0483c'}})


# ------------------------------------------------------------------ equipment
add('dagger', [
    "................",
    "................",
    "............kk..",
    "...........kbk..",
    "..........kbbk..",
    ".........kbBk...",
    "........kbBk....",
    ".......kbBk.....",
    "....kkkbBk......",
    "....kggBk.......",
    ".....kggk.......",
    "....khkgk.......",
    "...khk.kk.......",
    "..khk...........",
    "..kk............",
    "................",
], {'b': '#e6edf5', 'B': '#8a93a3', 'g': '#5a5a68', 'h': '#3a2a3a'})

add('mace', [
    "................",
    ".........k..k...",
    "........kmkkmk..",
    ".......kkmmmmkk.",
    "......kmmlmmmmk.",
    ".......kmlmmmk..",
    "......kkmmmmmkk.",
    "......kmkmmMkmk.",
    ".......kkhMkk...",
    "......khhkk.....",
    ".....khhk.......",
    "....khhk........",
    "...khhk.........",
    "..kggk..........",
    "..kkk...........",
    "................",
], {'m': '#8a93a3', 'M': '#555d6c', 'l': '#dfe6ee', 'h': '#7a5232', 'g': '#f0cf62'})

add('staff', [
    "......kk",
    ".....koo",
    "....kooO",
    "....kooo",
    ".....koo",
    "....kggg",
    ".....kgh",
    "......kh",
    "......kh",
    "......kh",
    "......kh",
    "......kh",
    "......kh",
    "......kh",
    "......kh",
    "......kk",
], {'o': '#6fd8ff', 'O': '#ffffff', 'g': '#f0cf62', 'h': '#7a5232'},
    variants={'doom': {'o': '#b05ae5', 'O': '#ff5a4a', 'g': '#4a2a5c', 'h': '#241432'}})

add('armor', [
    "........",
    "..kkk.kk",
    ".kaaakaa",
    "kaaaaaaa",
    "kaAkaaal",
    "kaAkaaal",
    ".kk.kaal",
    "....kaaA",
    "....kaal",
    "....kaaA",
    "....kaal",
    "....kaaA",
    "....kaaa",
    "....kAAA",
    "....kkkk",
    "........",
], {'a': '#c9bfa6', 'A': '#978d76', 'l': '#ece4d0'},
    variants={
        'leather': {'a': '#8a5a34', 'A': '#5e3a20', 'l': '#b07a4a'},
        'chain': {'a': '#8a93a3', 'A': '#555d6c', 'l': '#c9d2de'},
        'plate': {'a': '#aab4c4', 'A': '#b8902e', 'l': '#f2f6fa'},
    })

add('helmet', [
    "........",
    "......pp",
    ".....kpp",
    "....kkkk",
    "...kmmml",
    "..kmmmml",
    "..kmmmml",
    "..kMMMMM",
    "..kmkvvk",
    "..kmmmml",
    "..kmmkml",
    "...kmkml",
    "...kMkMl",
    "....kkkk",
    "........",
    "........",
], {'m': '#8a93a3', 'M': '#555d6c', 'l': '#dfe6ee', 'v': '#1c1420', 'p': '#a8322c'},
    variants={
        'leather': {'m': '#8a5a34', 'M': '#5e3a20', 'l': '#b07a4a', 'p': '#00000000'},
        'hood': {'m': '#3d2a6b', 'M': '#281a48', 'l': '#5d44a0', 'p': '#00000000', 'v': '#120c1c'},
    })

add('mask', [
    "........",
    ".k......",
    ".kk..kkk",
    "..kkkmmm",
    "..kmmmmm",
    "..kmkkmm",
    "..kmeekm",
    "..kmmmmm",
    "..kmmmkm",
    "...kmmmk",
    "...kmtkt",
    "....kmmm",
    ".....kkk",
    "........",
    "........",
    "........",
], {'m': '#8a2436', 'e': '#ffd34a', 't': '#f6f1e2'})

# ------------------------------------------------------------------ relics
add('ring', [
    "........",
    "........",
    "........",
    "......kk",
    ".....krr",
    ".....krR",
    "....kkkk",
    "..kkgggg",
    ".kggkkkk",
    ".kgk....",
    ".kgk....",
    ".kggkkkk",
    "..kkgggg",
    "....kkkk",
    "........",
    "........",
], {'g': '#f0cf62', 'r': '#6fd08a', 'R': '#d8ffe0'},
    variants={'blood': {'g': '#8a93a3', 'r': '#e0483c', 'R': '#ffb0a8'}})

add('eye', [
    "........",
    "........",
    "........",
    "..k..k.k",
    "....kkkk",
    "..kkwwww",
    ".kwwwiii",
    "kwwwiipp",
    "kwwwiipp",
    ".kwwwiii",
    "..kkwwww",
    "....kkkk",
    "........",
    "........",
    "........",
    "........",
], {'w': '#f6f1e2', 'i': '#d9902e', 'p': '#1c1420'})

add('crystal', [
    "........",
    "......kk",
    ".....kcC",
    "....kccC",
    "...kcccC",
    "...kcccC",
    "..kcccCC",
    "..kccDCC",
    "..kccDCC",
    "...kcDDC",
    "...kcDDC",
    "....kcDD",
    ".....kcD",
    "......kk",
    "........",
    "........",
], {'c': '#a060e0', 'C': '#e0c0ff', 'D': '#6a2a9a'},
    variants={'core': {'c': '#3a2060', 'C': '#e0483c', 'D': '#180c2c'}})

add('crest', [
    "........",
    ".kkkkkkk",
    "kssssssg",
    "kssssssg",
    "ksgggggg",
    "kssssssg",
    "kssssssg",
    ".ksssssg",
    ".ksssssg",
    "..kssssg",
    "..kssssg",
    "...ksssg",
    "....kssg",
    ".....ksg",
    "......kk",
    "........",
], {'s': '#4a6aa8', 'g': '#f0cf62'},
    variants={'steel': {'s': '#8a93a3', 'g': '#dfe6ee'}})

add('amulet', [
    ".n......",
    "..n.....",
    "...n....",
    "....n...",
    ".....kkk",
    "....kggg",
    "...kgaaa",
    "...kgaae",
    "...kgaae",
    "...kgaaa",
    "....kggg",
    ".....kkk",
    "........",
    "........",
    "........",
    "........",
], {'n': '#b8902e', 'g': '#f0cf62', 'a': '#2a8a8a', 'e': '#c0fff0'})

# ------------------------------------------------------------------ consumables
add('potion', [
    "........",
    ".....kkk",
    ".....kcc",
    ".....kgg",
    ".....kgg",
    "....kkgg",
    "...kgggg",
    "..kgllll",
    "..klLlll",
    "..klLlll",
    "..kllllD",
    "..klllDD",
    "...kDDDD",
    "....kkkk",
    "........",
    "........",
], {'c': '#a08a70', 'g': '#cfe6f0', 'l': '#e0483c', 'L': '#ffb0a8', 'D': '#8a1c1c'},
    variants={
        'attack': {'l': '#ff9a3c', 'L': '#ffe0a8', 'D': '#b85a14'},
        'defence': {'l': '#4a8ae0', 'L': '#c0dcff', 'D': '#24508a'},
        'antidote': {'l': '#6fbf5a', 'L': '#d8ffc8', 'D': '#3f8a3a'},
    })

add('bomb', [
    "...........y....",
    "..........yoy...",
    ".........k.y....",
    "........kk......",
    ".....kkkkkk.....",
    "....kbbbbbbk....",
    "...kbblbbbbbk...",
    "..kbblbbbbbbbk..",
    "..kbbbbbbbbbbk..",
    "..kbbbbbbbbBbk..",
    "..kbbbbbbbBBbk..",
    "..kbbbbbbBBBbk..",
    "...kbbbBBBBbk...",
    "....kbbBBBbk....",
    ".....kkkkkk.....",
    "................",
], {'y': '#ffd34a', 'o': '#ff5a4a', 'b': '#4a4458', 'B': '#2a2434', 'l': '#8a8498'})

add('feather', [
    "............kk..",
    "..........kkffk.",
    ".........kffFfk.",
    "........kfffFfk.",
    ".......kffFFffk.",
    "......kffFFffk..",
    ".....kffFFffk...",
    "....kffFFffk....",
    "....kfFFffk.....",
    "...kfFFffk......",
    "...kFFfkk.......",
    "..kqkkk.........",
    ".kqk............",
    "kqk.............",
    "kk..............",
    "................",
], {'f': '#ff7a3c', 'F': '#ffd34a', 'q': '#f6f1e2'})

# ------------------------------------------------------------------ UI
add('coin', [
    "........",
    "........",
    "........",
    "........",
    "....kkkk",
    "..kkgggg",
    ".kggGGGg",
    ".kgGgggd",
    ".kgGgggd",
    ".kgGgggd",
    ".kggdddg",
    "..kkgggg",
    "....kkkk",
    "........",
    "........",
    "........",
], {'g': '#f0cf62', 'G': '#fff3b0', 'd': '#b8902e'})

add('star', [
    "........",
    "........",
    ".......k",
    "......ks",
    "......ks",
    ".....kss",
    "..kkkssS",
    ".ksssSSS",
    "..kkkssS",
    ".....kss",
    "......ks",
    "......ks",
    ".......k",
    "........",
    "........",
    "........",
], {'s': '#b9a0ff', 'S': '#ffffff'},
    variants={'stun': {'s': '#ffd34a', 'S': '#fff8d0'}})

add('heart', [
    "........",
    "........",
    "........",
    "..kkkk..",
    ".krrrrk.",
    "krRrrrrk",
    "krRrrrrr",
    "krrrrrrr",
    ".krrrrrr",
    "..krrrrr",
    "...krrrr",
    "....krrr",
    ".....krr",
    "......kk",
    "........",
    "........",
], {'r': '#e0483c', 'R': '#ffb0a8'})

add('wings', [
    "........",
    ".....ggg",
    "....g...",
    "........",
    ".k......",
    "kak.....",
    "kaak....",
    "kaaak..k",
    "kaaaakka",
    ".kaaaaaa",
    ".kaAaaAa",
    "..kaAaAk",
    "...kakak",
    "....k.k.",
    "........",
    "........",
], {'g': '#f0cf62', 'a': '#f6f1e2', 'A': '#b9b2a2'})

add('flame', [
    "........",
    ".......k",
    "......kf",
    ".....kff",
    "..k..kff",
    ".kfk.kfF",
    ".kffkffF",
    "kfffffFF",
    "kffFFFFy",
    "kffFFyyy",
    "kffFyyyy",
    ".kfFFyyy",
    ".kffFFyy",
    "..kkfFFF",
    "....kkkk",
    "........",
], {'f': '#e0483c', 'F': '#ff9a3c', 'y': '#ffe36a'})

add('door', [
    "........",
    "....kkkk",
    "..kkdddd",
    ".kdddddd",
    ".kddDddd",
    ".kddDddd",
    ".kddDddd",
    ".kddDddg",
    ".kddDddd",
    ".kddDddd",
    ".kddDddd",
    ".kddDddd",
    ".kddDddd",
    ".kkkkkkk",
    "........",
    "........",
], {'d': '#8a5a34', 'D': '#5e3a20', 'g': '#f0cf62'})

add('drop', [
    "........",
    ".......k",
    "......kr",
    "......kr",
    ".....krr",
    ".....krr",
    "....krrr",
    "...krRrr",
    "..krRrrr",
    "..krRrrr",
    "..krrrrr",
    "..krrrrD",
    "...krrDD",
    "....kkkk",
    "........",
    "........",
], {'r': '#e0483c', 'R': '#ffb0a8', 'D': '#8a1c1c'})

add('skull', [
    "........",
    "........",
    "....kkkk",
    "..kkoooo",
    ".koooooo",
    ".koooooo",
    ".kokkkoo",
    ".kokkkoo",
    ".koooook",
    "..kooooo",
    "...kokok",
    "...kokok",
    "...kkkkk",
    "........",
    "........",
    "........",
], {'o': '#e6dfc8'})

add('crown', [
    "........",
    "........",
    "........",
    "k......k",
    "kk....kg",
    "kgk..kgg",
    "kggkkggg",
    "kggggggr",
    "kggGGGgr",
    "kggggggg",
    "kGGGGGGG",
    "kkkkkkkk",
    "........",
    "........",
    "........",
    "........",
], {'g': '#f0cf62', 'G': '#b8902e', 'r': '#e0483c'})

add('question', [
    "................",
    "................",
    ".....kkkkkk.....",
    "....kqqqqqqk....",
    "...kqqkkkkqqk...",
    "...kqqk..kqqk...",
    "....kk...kqqk...",
    "........kqqk....",
    ".......kqqk.....",
    "......kqqk......",
    "......kqqk......",
    "......kkkk......",
    "......kqqk......",
    "......kqqk......",
    "......kkkk......",
    "................",
], {'q': '#b9a0ff'})

add('candle', [
    "........",
    ".......k",
    "......kf",
    ".....kfy",
    ".....kfy",
    "......kk",
    ".....kww",
    ".....kww",
    ".....kwW",
    ".....kww",
    ".....kwW",
    ".....kww",
    "...kkkww",
    "..kgggkk",
    "..kkkkkk",
    "........",
], {'f': '#ff9a3c', 'y': '#ffe36a', 'w': '#f6f1e2', 'W': '#c9bfa6', 'g': '#b8902e'})

add('trophy', [
    "........",
    "........",
    "..kkkkkk",
    "kkkggggG",
    "kgkggggG",
    "kgkggggG",
    ".kkggggG",
    "...kgggG",
    "....kggG",
    ".....kgG",
    "......kg",
    "......kg",
    "....kkgg",
    "...kgggg",
    "...kkkkk",
    "........",
], {'g': '#f0cf62', 'G': '#fff3b0'},
    variants={'silver': {'g': '#aab4c4', 'G': '#f2f6fa'}, 'bronze': {'g': '#b8763a', 'G': '#e8b080'}})

add('book', [
    "........",
    "........",
    "........",
    ".kkkkkk.",
    "kpppppPk",
    "kplllpPk",
    "kpppppPk",
    "kplllpPk",
    "kpppppPk",
    "kplllpPk",
    "kpppppPk",
    "kbbbbbbk",
    ".kkkkkkk",
    "........",
    "........",
    "........",
], {'p': '#f6f1e2', 'P': '#c9bfa6', 'l': '#8a7a5a', 'b': '#8a2436'})

add('key', [
    "........",
    ".....kkk",
    "....kggg",
    "...kggkk",
    "...kgk..",
    "...kggkk",
    "....kggg",
    ".....kkg",
    "......kg",
    "......kg",
    "......kggkk.....",
    "......kggggk....",
    "......kggkk.....",
    "......kggggk....",
    "......kggkk.....",
    ".......kk.......",
], {'g': '#f0cf62'})

add('chest', [
    "........",
    "........",
    "........",
    "........",
    "..kkkkkk",
    ".kbbbbbb",
    "kbBBBBBg",
    "kbbbbbbg",
    "kkkkkkgg",
    "kbbbbbgg",
    "kbBBBBbb",
    "kbbbbbbb",
    "kkkkkkkk",
    "........",
    "........",
    "........",
], {'b': '#8a5a34', 'B': '#b07a4a', 'g': '#f0cf62'})

add('pouch', [
    "........",
    "........",
    ".....kkk",
    "....knnn",
    ".....knn",
    "....kbbb",
    "...kbbbb",
    "..kbbBbb",
    ".kbbBbbg",
    ".kbbBbgg",
    ".kbbbbbg",
    ".kbbbbbb",
    "..kbbbbb",
    "...kkkkk",
    "........",
    "........",
], {'n': '#f0cf62', 'b': '#8a5a34', 'B': '#b07a4a', 'g': '#f0cf62'})

add('scroll', [
    "........",
    "........",
    ".kkkkkkk",
    "kPPPPPPP",
    ".kpppppp",
    ".kplllpp",
    ".kpppppp",
    ".kpllllp",
    ".kpppppp",
    ".kplllpp",
    ".kpppppp",
    "kPPPPPPP",
    ".kkkkkkk",
    "........",
    "........",
    "........",
], {'p': '#f6f1e2', 'P': '#c9bfa6', 'l': '#8a2436'})

add('grave', [
    "........",
    "........",
    "......kk",
    "......ks",
    "....kkks",
    "....ksss",
    "....kkks",
    "......ks",
    "......ks",
    "......ks",
    "......ks",
    "...kkkks",
    "..kmmmmm",
    ".kkkkkkk",
    "........",
    "........",
], {'s': '#a9a7b0', 'm': '#4e4c56'})

add('bat', [
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "kk....k.",
    "kbkk.kbk",
    "kbbbkbbb",
    ".kbbbbeb",
    "..kkbbbb",
    "....kkbk",
    "......k.",
    "........",
    "........",
    "........",
], {'b': '#3a2c48', 'e': '#e0483c'})


def moon(x, y):
    d1 = math.hypot(x - 7.5, y - 7.5)
    d2 = math.hypot(x - 10.5, y - 5.5)
    if d1 < 5.6 and d2 >= 5.0:
        return 'M' if d1 < 4.2 and d2 >= 6.0 else 'm'
    if d1 < 6.6 and d2 >= 4.1:
        return 'k'
    return '.'


def gear(x, y):
    cx = cy = 7.5
    d = math.hypot(x - cx, y - cy)
    ang = (math.degrees(math.atan2(y - cy, x - cx)) + 360) % 360
    tooth = (ang % 45) < 22.5
    outer = 6.6 if tooth else 5.0
    if d < 2.0:
        return '.' if d < 1.2 else 'k'
    if d < outer - 1.0:
        return 'G' if d < 3.4 else 'g'
    if d < outer:
        return 'k'
    return '.'


def burst(x, y):
    cx = cy = 7.5
    d = math.hypot(x - cx, y - cy)
    ang = (math.degrees(math.atan2(y - cy, x - cx)) + 360) % 360
    spike = abs(((ang + 22.5) % 45) - 22.5) / 22.5      # 0 at a spike tip direction, 1 between
    reach = 7.2 - 4.0 * spike
    if d < 2.2:
        return 'y'
    if d < reach - 1.2:
        return 'o'
    if d < reach:
        return 'r'
    if d < reach + 0.9:
        return 'k'
    return '.'


procedural('moon', moon, {'m': '#b9a0ff', 'M': '#e8deff'})
procedural('gear', gear, {'g': '#8a93a3', 'G': '#c9d2de'})
procedural('burst', burst, {'y': '#fff3b0', 'o': '#ffb03c', 'r': '#e0483c'})


# ------------------------------------------------------------------ output
def hex_to_rgba(h):
    h = h.lstrip('#')
    if len(h) == 8:
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4, 6))
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def write_png(path, pixels, w, h):
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in pixels)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def preview(path, scale=5, per_row=11):
    cells = []
    for name, sp in SPRITES.items():
        cells.append((name, sp['rows'], sp['palette']))
        for vname, vpal in sp['variants'].items():
            pal = dict(sp['palette'])
            pal.update(vpal)
            cells.append((name + ':' + vname, sp['rows'], pal))
    cell = 16 * scale + 12
    rows_n = (len(cells) + per_row - 1) // per_row
    W, H = per_row * cell, rows_n * cell
    bg = (24, 18, 34, 255)
    img = [[bg] * W for _ in range(H)]
    for i, (_, rows, pal) in enumerate(cells):
        ox, oy = (i % per_row) * cell + 6, (i // per_row) * cell + 6
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '.':
                    continue
                c = hex_to_rgba(pal[ch])
                if c[3] == 0:
                    continue
                for dy in range(scale):
                    for dx in range(scale):
                        img[oy + y * scale + dy][ox + x * scale + dx] = c
    write_png(path, img, W, H)
    return [c[0] for c in cells]


if __name__ == '__main__':
    out_json, out_png = sys.argv[1], sys.argv[2]
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(SPRITES, f, ensure_ascii=False, separators=(',', ':'))
    names = preview(out_png)
    print(len(SPRITES), 'sprites,', len(names), 'cells')
    print(' | '.join(names))
