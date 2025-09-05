import importPlugin from 'eslint-plugin-import'

export default [
  // Global ignores
  {
    ignores: [
      "**/*.min.js",
      "**/dist/",
      "**/vendor/",
      "_site/",
      "site/public/",
      "site/assets/",
      "site/.astro/",
      "font/",
      "node_modules/",
      ".cache/",
      "reference/**/*.md"
    ]
  },

  // Base configuration for all JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly'
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      // XO base rules
      'arrow-body-style': 'off',
      'capitalized-comments': 'off',
      'comma-dangle': ['error', 'never'],
      'indent': ['error', 2, {
        'MemberExpression': 'off',
        'SwitchCase': 1
      }],
      'logical-assignment-operators': 'off',
      'max-params': ['warn', 5],
      'multiline-ternary': ['error', 'always-multiline'],
      'new-cap': ['error', { 'properties': false }],
      'no-console': 'error',
      'no-negated-condition': 'off',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'after'],
      'prefer-object-has-own': 'off',
      'prefer-template': 'error',
      'semi': ['error', 'never'],
      'strict': 'error',

      // Import plugin rules
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            'astro:*',    // Ignore Astro virtual modules
            'https://*',  // Ignore CDN imports
            'http://*'    // Ignore CDN imports
          ]
        }
      ],
      'import/extensions': ['error', 'ignorePackages', { 'js': 'always' }],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-amd': 'error',
      'import/no-cycle': ['error', { 'ignoreExternal': true }],
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-named-default': 'error',
      'import/no-self-import': 'error',
      'import/no-unassigned-import': ['error'],
      'import/no-useless-path-segments': 'error',
      'import/order': 'error'
    }
  },

  // Build scripts configuration
  {
    files: ['build/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },

  // Site scripts configuration (browser environment)
  {
    files: ['site/**/*.js'],
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-new': 'off'
    }
  },

  // ES6 modules in site assets
  {
    files: [
      'site/src/assets/application.js',
      'site/src/assets/icons-docs/icon-search.js',
      'site/src/assets/partials/*.js',
      'site/src/assets/search.js',
      'site/src/assets/snippets.js',
      'site/src/assets/stackblitz.js',
      'site/src/plugins/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    }
  },

  // JavaScript code blocks in markdown
  {
    files: ['**/*.md/*.js', '**/*.md/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // Remove unicorn rule for markdown
    }
  }
]
