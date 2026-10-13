"""
Fractional Indexing (Lexorank style) implementation.
Computes a base-62 lexicographical midpoint between two strings, enabling O(1) reordering.
"""

BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
BASE_DICT = {c: i for i, c in enumerate(BASE62)}

def _char_to_val(c: str) -> int:
    return BASE_DICT.get(c, 0)

def _val_to_char(v: int) -> str:
    return BASE62[v % 62]

def generate_key_between(prev: str | None, next: str | None) -> str:
    """
    Generates a string key strictly between `prev` and `next` lexicographically.
    If prev is None, generates a key before next.
    If next is None, generates a key after prev.
    If both are None, generates a standard midpoint key ("a0").
    """
    if not prev and not next:
        return "a0"
    
    if not prev:
        # Generate key before next
        if next == "0":
            return "00"
        # Find first non-zero char or decrement
        first_char_val = _char_to_val(next[0])
        if first_char_val > 0:
            mid = first_char_val // 2
            return _val_to_char(mid)
        return "0" + generate_key_between(None, next[1:] if len(next) > 1 else None)
    
    if not next:
        # Generate key after prev
        last_char_val = _char_to_val(prev[-1])
        if last_char_val < 61:
            mid = (last_char_val + 61 + 1) // 2
            return prev[:-1] + _val_to_char(mid)
        return prev + "V"

    # Both prev and next exist
    i = 0
    while i < len(prev) and i < len(next) and prev[i] == next[i]:
        i += 1
    
    p_val = _char_to_val(prev[i]) if i < len(prev) else 0
    n_val = _char_to_val(next[i]) if i < len(next) else 62

    if n_val - p_val > 1:
        mid_val = (p_val + n_val) // 2
        return prev[:i] + _val_to_char(mid_val)
    
    # Needs extending
    prefix = prev[:i+1] if i < len(prev) else prev
    return prefix + "V"
