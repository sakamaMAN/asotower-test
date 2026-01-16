from src.engine.rules import computeDamage

# But importing from src.engine.rules as module isn't straightforward in this environment.
# We'll instead load the file and exec to get computeDamage into this script's namespace.

import runpy
import types

mod = runpy.run_path('src/engine/rules.js', run_name='__rules__')
# The file is JS, not Python — cannot import directly.

print('Cannot run JS code from Python test. Skipping.')
