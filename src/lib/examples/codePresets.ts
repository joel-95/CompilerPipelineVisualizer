// Educational Code Presets for Compiler Pipeline Visualizer

export interface CodePreset {
  id: string;
  name: string;
  category: 'Basics' | 'Functions' | 'Control Flow' | 'Errors';
  description: string;
  code: string;
}

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'variables-arithmetic',
    name: '1. Variables & Arithmetic',
    category: 'Basics',
    description: 'Declares variables of different types (int, float, string, bool) and calculates an arithmetic formula.',
    code: `// Basic Variable Declarations & Arithmetic
int a = 10;
int b = 25;
int sum = a + b * 2;
float pi = 3.14159;
string message = "Compiler Pipeline Visualizer";
bool isReady = true;
`,
  },
  {
    id: 'function-parameters',
    name: '2. Function with Parameters',
    category: 'Functions',
    description: 'Defines a helper function with typed parameters and return statement, then invokes it.',
    code: `// Function Definition & Invocation
int calculateArea(int width, int height) {
    int area = width * height;
    return area;
}

int w = 15;
int h = 8;
int result = calculateArea(w, h);
`,
  },
  {
    id: 'conditionals-if-else',
    name: '3. Conditional Branches (If/Else)',
    category: 'Control Flow',
    description: 'Demonstrates nested relational and equality operators inside if-else statement blocks.',
    code: `// Conditional Branching
int score = 85;
string grade = "F";

if (score >= 90) {
    grade = "A";
} else {
    if (score >= 80) {
        grade = "B";
    } else {
        grade = "C";
    }
}
`,
  },
  {
    id: 'loops-while-for',
    name: '4. Loops (While & For)',
    category: 'Control Flow',
    description: 'Demonstrates iteration structures with scoped counter variables and accumulator updates.',
    code: `// Loop Constructs
int total = 0;
int count = 1;

while (count <= 5) {
    total = total + count;
    count = count + 1;
}

for (int i = 0; i < 3; i = i + 1) {
    total = total + i;
}
`,
  },
  {
    id: 'semantic-error-demo',
    name: '5. Semantic & Type Errors (Diagnostic Demo)',
    category: 'Errors',
    description: 'Demonstrates compile-time diagnostics: assigning string to int, undeclared variable, and duplicate declaration.',
    code: `// Diagnostic Demo: Compiler catches semantic errors
int validNumber = 42;

// Error 1: Type mismatch (assigning string to int)
int wrongAssignment = "this should fail type checking";

// Error 2: Undeclared identifier
undeclaredVar = 100;

// Error 3: Duplicate variable declaration in same scope
int validNumber = 99;
`,
  },
];
