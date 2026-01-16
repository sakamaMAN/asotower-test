# Simple simulation of the movement/reservation logic from src/engine/actions.js
# This script reproduces the relevant parts to validate behavior after recent changes.
import math

def is_scout_in_skill_mode(unit):
    return unit.get('job') == 'scout' and unit.get('memory', {}).get('stealth', {}).get('turns', 0) > 0

def floor_pos(pos):
    return (math.floor(pos['x']), math.floor(pos['y']))

def is_occupied_cell(state, position, self_unit):
    cellX, cellY = floor_pos(position)
    key = f"{cellX},{cellY}"
    reserved = state.get('reservedCells', {})
    if key in reserved and reserved[key] != (self_unit and self_unit.get('id')):
        return True
    # If scout is in skill mode, allow pass-through (ignore occupancy), per spec
    if is_scout_in_skill_mode(self_unit):
        return False
    for unit in state['units']:
        if unit is self_unit or unit.get('hp', 0) <= 0:
            continue
        ux, uy = floor_pos(unit['position'])
        if ux == cellX and uy == cellY:
            return True
    return False


def find_available_position(state, basePos, self_unit):
    directions = [
        {'dx': 0, 'dy': -1},
        {'dx': 0, 'dy': 1},
        {'dx': 1, 'dy': 0},
        {'dx': -1, 'dy': 0}
    ]
    offset = 1
    while offset <= 5:
        for d in directions:
            pos = {'x': basePos['x'] + d['dx'] * offset, 'y': basePos['y'] + d['dy'] * offset}
            if not is_occupied_cell(state, pos, self_unit):
                return pos
        offset += 1
    return basePos


def movement_per_turn(unit):
    return unit['stats']['speed'] / 10.0


def handle_move(state, unit, command):
    speed = movement_per_turn(unit)
    dx = command['x'] - unit['position']['x']
    dy = command['y'] - unit['position']['y']
    distance = max(abs(dx), abs(dy))  # Chebyshev as in code
    if distance == 0:
        print(f"{unit['id']}: no movement needed")
        return
    scale = min(1, speed / distance)
    target = {'x': unit['position']['x'] + dx * scale, 'y': unit['position']['y'] + dy * scale}
    adjusted = target  # no walls logic in sim
    currentCell = {'x': math.floor(unit['position']['x']), 'y': math.floor(unit['position']['y'])}
    targetCell = {'x': math.floor(adjusted['x']), 'y': math.floor(adjusted['y'])}
    finalTargetCell = dict(targetCell)
    # enemy line detection skipped for brevity
    if is_occupied_cell(state, finalTargetCell, unit):
        finalTargetCell = find_available_position(state, finalTargetCell, unit)
    targetCell = finalTargetCell
    enteringNewCell = currentCell['x'] != targetCell['x'] or currentCell['y'] != targetCell['y']
    if enteringNewCell and is_occupied_cell(state, targetCell, unit):
        print(f"{unit['id']}: blocked, cannot find alternative")
        return
    orgposition = {'x': unit['position']['x'], 'y': unit['position']['y']}
    if enteringNewCell and (targetCell['x'] != math.floor(adjusted['x']) or targetCell['y'] != math.floor(adjusted['y'])):
        unit['position']['x'] = targetCell['x']
        unit['position']['y'] = targetCell['y']
    else:
        unit['position']['x'] = adjusted['x']
        unit['position']['y'] = adjusted['y']
    # reserve the destination cell
    res_key = f"{math.floor(unit['position']['x'])},{math.floor(unit['position']['y'])}"
    state['reservedCells'][res_key] = unit['id']
    print(f"{unit['id']} moved from ({orgposition['x']:.2f},{orgposition['y']:.2f}) to ({unit['position']['x']:.2f},{unit['position']['y']:.2f}); reserved {res_key}")


def run_tests():
    passed = 0
    failed = 0

    def assert_true(cond, msg):
        nonlocal passed, failed
        if cond:
            print('  PASS:', msg)
            passed += 1
        else:
            print('  FAIL:', msg)
            failed += 1

    # Test A: Scout pass-through + reservation
    print('Test A: Scout pass-through + reservation')
    state = {'reservedCells': {}, 'units': []}
    scout = {'id': 'scout-1', 'side': 'west', 'job': 'scout', 'position': {'x':1.0,'y':1.0}, 'hp':100, 'memory': {'stealth': {'turns': 2}}, 'stats': {'speed': 10}}
    ally1 = {'id': 'ally-1', 'side': 'west', 'job': 'soldier', 'position': {'x':2.0,'y':1.0}, 'hp':100, 'stats': {'speed': 10}}
    ally2 = {'id': 'ally-2', 'side': 'west', 'job': 'soldier', 'position': {'x':0.0,'y':0.0}, 'hp':100, 'stats': {'speed': 10}}
    enemy = {'id': 'enemy-1', 'side': 'east', 'job': 'soldier', 'position': {'x':3.0,'y':1.0}, 'hp':100, 'stats': {'speed': 10}}
    state['units'] = [scout, ally1, ally2, enemy]
    handle_move(state, scout, {'x':2,'y':1})
    # scout should be allowed to go into ally1 cell (pass-through)
    sfx = math.floor(scout['position']['x']), math.floor(scout['position']['y'])
    assert_true(sfx == (2,1), 'scout passed through to (2,1)')
    # reservation should prevent ally2 from occupying same cell
    handle_move(state, ally2, {'x':2,'y':1})
    a2f = math.floor(ally2['position']['x']), math.floor(ally2['position']['y'])
    assert_true(a2f != (2,1), 'ally2 blocked from entering reserved (2,1)')

    # Test B: Non-scout blocked by occupied cell
    print('\nTest B: Non-scout blocked by occupied cell')
    state = {'reservedCells': {}, 'units': []}
    blocker = {'id': 'blocker', 'side': 'west', 'job': 'soldier', 'position': {'x':2.0,'y':1.0}, 'hp':100, 'stats': {'speed': 10}}
    mover = {'id': 'mover', 'side': 'west', 'job': 'soldier', 'position': {'x':0.0,'y':0.0}, 'hp':100, 'stats': {'speed': 10}}
    state['units'] = [blocker, mover]
    handle_move(state, mover, {'x':2,'y':1})
    mpos = math.floor(mover['position']['x']), math.floor(mover['position']['y'])
    assert_true(mpos != (2,1), 'non-scout mover not allowed into occupied cell (2,1)')

    # Test C: Two allies racing for same empty cell
    print('\nTest C: Two allies racing for same empty cell')
    state = {'reservedCells': {}, 'units': []}
    a1 = {'id':'a1','side':'west','job':'soldier','position':{'x':0.0,'y':0.0},'hp':100,'stats':{'speed':10}}
    a2 = {'id':'a2','side':'west','job':'soldier','position':{'x':0.0,'y':1.0},'hp':100,'stats':{'speed':10}}
    state['units'] = [a1,a2]
    # both aim for (1,0); a1 moves first
    handle_move(state, a1, {'x':1,'y':0})
    handle_move(state, a2, {'x':1,'y':0})
    a1pos = math.floor(a1['position']['x']), math.floor(a1['position']['y'])
    a2pos = math.floor(a2['position']['x']), math.floor(a2['position']['y'])
    assert_true(a1pos == (1,0) and a2pos != (1,0), 'first mover reserved cell, second mover did not enter same cell')

    # Test D: Fractional movement accumulation across turns
    print('\nTest D: Fractional movement accumulation')
    state = {'reservedCells': {}, 'units': []}
    slow = {'id':'slow','side':'west','job':'soldier','position':{'x':0.0,'y':0.0},'hp':100,'stats':{'speed':5}}
    state['units'] = [slow]
    # move to (1,0) twice (two turns)
    handle_move(state, slow, {'x':1,'y':0})
    pos1 = slow['position']['x']
    handle_move(state, slow, {'x':1,'y':0})
    pos2 = slow['position']['x']
    assert_true(pos1 > 0 and pos1 < 1 and abs(pos2 - 1.0) < 1e-6, f'slow moved from {pos1} then to {pos2} (accumulation)')

    print('\nTest summary:', f'passed={passed}, failed={failed}')
    return 0 if failed == 0 else 1

if __name__ == '__main__':
    exit(run_tests())
