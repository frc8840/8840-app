
# MoveScript Format

MoveScipt files start off with a declaration of name and field type.

```move
#DEFINE NAME {name}
#DEFINE FIELD {field}
```

Comments are made with `//` and are ignored by the parser. All comments must be on their own line.

The name is the name of the script, and the field is the field type that the script is for. The field type is used to determine the size of the field, and what game objects are allowed to be used in the script.

Pathing:

All paths are surrounded with a start and end declaration.

```move
#START PATH {name}
// pathing
#END PATH
```

All path segments are surrounded with a start and end declaration.

```move
#START SEGMENT {name}
// locations
#END SEGMENT
```

Current commands:

```move
START (x, y)
HARD (x, y)
SOFT (x, y)
```

X and Y can be any number, but they must be in the field.
Units must be provided, except for 0.
Use `+` or `-` to stay relative to the previous point.

```move
START (0, 0)

//Current location becomes (1m, 0)
HARD (1m, 0)

// Same as SOFT (2m, 0), current location becomes (2m, 0)
SOFT (+1m, 0)

// Same as HARD (0, 0), current location becomes (0, 0)
HARD (-2m, 0)
```

Current variables:

```move
// refers to the start of the segment, if not defined, it is (0,0)
$START
```
