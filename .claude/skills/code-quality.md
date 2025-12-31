# Code Quality Skill

## Overview
Code quality and style rules from Ultracite for clean, maintainable JavaScript/TypeScript.

## Variable Declarations

### Use const/let, Never var
```typescript
// ❌ Bad
var count = 0;

// ✅ Good
const count = 0;
let mutableCount = 0;
```

### No Undefined Initialization
```typescript
// ❌ Bad
let value = undefined;

// ✅ Good
let value;
```

### No Shadowing
```typescript
// ❌ Bad
const user = 'John';
const getUser = () => {
  const user = 'Jane'; // Shadows outer user
};

// ✅ Good
const userName = 'John';
const getUser = () => {
  const fetchedUser = 'Jane';
};
```

## Functions

### Arrow Functions Over Function Expressions
```typescript
// ❌ Bad
const add = function(a, b) {
  return a + b;
};

// ✅ Good
const add = (a: number, b: number) => a + b;
```

### for...of Over forEach
```typescript
// ❌ Bad
items.forEach(item => process(item));

// ✅ Good
for (const item of items) {
  process(item);
}
```

### No Parameter Reassignment
```typescript
// ❌ Bad
const process = (data) => {
  data = transform(data); // Reassigning parameter
  return data;
};

// ✅ Good
const process = (data) => {
  const transformed = transform(data);
  return transformed;
};
```

### Default Parameters Last
```typescript
// ❌ Bad
const greet = (name = 'World', greeting) => `${greeting}, ${name}`;

// ✅ Good
const greet = (greeting: string, name = 'World') => `${greeting}, ${name}`;
```

## Modern JavaScript

### Optional Chaining
```typescript
// ❌ Bad
const name = user && user.profile && user.profile.name;

// ✅ Good
const name = user?.profile?.name;
```

### Nullish Coalescing
```typescript
// ❌ Bad
const value = data !== null && data !== undefined ? data : 'default';

// ✅ Good
const value = data ?? 'default';
```

### Object Spread Over Object.assign
```typescript
// ❌ Bad
const merged = Object.assign({}, defaults, options);

// ✅ Good
const merged = { ...defaults, ...options };
```

### Template Literals
```typescript
// ❌ Bad
const message = 'Hello, ' + name + '!';

// ✅ Good
const message = `Hello, ${name}!`;

// But avoid when not needed
// ❌ Bad
const plain = `No interpolation here`;
// ✅ Good
const plain = 'No interpolation here';
```

### Exponentiation Operator
```typescript
// ❌ Bad
const squared = Math.pow(x, 2);

// ✅ Good
const squared = x ** 2;
```

### flatMap
```typescript
// ❌ Bad
const result = items.map(transform).flat();

// ✅ Good
const result = items.flatMap(transform);
```

### Array.at() for Index Access
```typescript
// ❌ Bad
const last = items[items.length - 1];

// ✅ Good
const last = items.at(-1);
```

## Comparisons

### Strict Equality
```typescript
// ❌ Bad
if (value == null) { }
if (value != 0) { }

// ✅ Good
if (value === null) { }
if (value !== 0) { }
```

### No Yoda Conditions
```typescript
// ❌ Bad
if ('red' === color) { }

// ✅ Good
if (color === 'red') { }
```

### Use Number.isNaN
```typescript
// ❌ Bad
if (isNaN(value)) { }

// ✅ Good
if (Number.isNaN(value)) { }
```

## Control Flow

### No Negated Conditions with Else
```typescript
// ❌ Bad
if (!isValid) {
  handleInvalid();
} else {
  handleValid();
}

// ✅ Good
if (isValid) {
  handleValid();
} else {
  handleInvalid();
}
```

### Early Return Over Else
```typescript
// ❌ Bad
const process = (data) => {
  if (!data) {
    return null;
  } else {
    return transform(data);
  }
};

// ✅ Good
const process = (data) => {
  if (!data) return null;
  return transform(data);
};
```

### Switch Must Have Default
```typescript
// ❌ Bad
switch (type) {
  case 'a': return handleA();
  case 'b': return handleB();
}

// ✅ Good
switch (type) {
  case 'a': return handleA();
  case 'b': return handleB();
  default: return handleDefault();
}
```

## Error Handling

### Throw Error Objects
```typescript
// ❌ Bad
throw 'Something went wrong';
throw { message: 'Error' };

// ✅ Good
throw new Error('Something went wrong');
```

### Error Messages Required
```typescript
// ❌ Bad
throw new Error();

// ✅ Good
throw new Error('User not found');
```

## Strings

### String.slice() Over substring/substr
```typescript
// ❌ Bad
const sub = str.substring(0, 5);
const sub2 = str.substr(0, 5);

// ✅ Good
const sub = str.slice(0, 5);
```

### trimStart/trimEnd
```typescript
// ❌ Bad
const trimmed = str.trimLeft();

// ✅ Good
const trimmed = str.trimStart();
```

## Numbers

### Numeric Separators
```typescript
// ❌ Bad
const million = 1000000;

// ✅ Good
const million = 1_000_000;
```

### parseInt with Radix
```typescript
// ❌ Bad
const num = parseInt(str);

// ✅ Good
const num = parseInt(str, 10);
```

### Date.now()
```typescript
// ❌ Bad
const now = new Date().getTime();

// ✅ Good
const now = Date.now();
```
