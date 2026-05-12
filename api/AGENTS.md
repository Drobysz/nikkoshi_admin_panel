<project-guidelines>

# Nikkoshi API Project Context

## Project Overview

Nikkoshi is a Laravel API and admin panel project for a website about temples and shrines in Japan. The main content entity is an `Article`. Each article has an author, a cover image, paragraphs, and historical timeline events.

The API is intentionally simple and is focused on CRUD operations for articles and related article content.

## Main Models

The project uses four main models:

- `User`
- `Article`
- `Paragraph`
- `Timeline`

## Database Relationships

```text
User hasMany Article
Article belongsTo User as author
Article hasMany Paragraph
Article hasMany Timeline
Paragraph belongsTo Article
Timeline belongsTo Article
```

More specifically:

```text
users.id -> articles.author_id
articles.id -> paragraphs.article_id
articles.id -> timelines.article_id
```

The `author_id` field in `articles` references `users.id`.

## Database Tables

### users

The `users` table is used for admin users.

```text
id
name
password
remember_token
timestamps
```

Important note: the user does **not** have an `email` field in this project.

### articles

```text
id
title
subtitle
year
type
author_id
timestamps
```

### paragraphs

```text
id
article_id
title
text
order
timestamps
```

### timelines

```text
id
article_id
year
event
timestamps
```

## Laravel Naming Conventions

The project follows Laravel table naming conventions:

```text
Article -> articles
Paragraph -> paragraphs
Timeline -> timelines
User -> users
```

If the model name is `Article` and the table is `articles`, the model does not need:

```php
protected $table = 'articles';
```

Laravel will automatically resolve the table name.

## Foreign Keys

If a foreign key references `$table->id()`, its type should match Laravel's default ID type:

```php
$table->foreignId('article_id');
```

or:

```php
$table->unsignedBigInteger('article_id');
```

For article paragraphs and timelines, `article_id` should usually be required and cascade on delete:

```php
$table->foreignId('article_id')
    ->constrained('articles')
    ->cascadeOnDelete();
```

For article authors:

```php
$table->foreignId('author_id')
    ->constrained('users');
```

If `nullOnDelete()` is used, the field must also be nullable:

```php
$table->foreignId('author_id')
    ->nullable()
    ->constrained('users')
    ->nullOnDelete();
```

## Authentication

The project uses Laravel Sanctum for API authentication.

Login is performed using:

```text
name
password
```

The password is stored as a hash.

Password checking should be done like this:

```php
Hash::check($data['password'], $user->password)
```

The plain password from the request should **not** be manually hashed before `Hash::check()`.

Correct:

```php
Hash::check($plainPassword, $hashedPasswordFromDatabase);
```

Incorrect:

```php
Hash::check(Hash::make($plainPassword), $hashedPasswordFromDatabase);
```

## Sanctum Tokens

After a successful login, the API returns a Sanctum token:

```php
$token = $user->createToken('token')->plainTextToken;
```

The frontend or API client should send this token in the `Authorization` header:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

In Insomnia, use:

```text
Auth Type: Bearer Token
Token: 1|your_token_here
Prefix: Bearer
```

The full token must be used, including the part before the pipe symbol:

```text
1|xxxxxxxxxxxxxxxxxxxxxxxx
```

## Current API Routes

The current `api.php` structure is:

```php
Route::post('/register', [UserController::class, 'store']);
Route::post('/login',    [UserController::class, 'login']);
Route::post('/logout',   [UserController::class, 'logout'])
    ->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource(
        'articles',
        ArticleController::class
    );
});

Route::fallback(function () {
    return response()->json(["message" => "Not found"], 404);
});
```

This creates the following important endpoints:

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/articles
POST   /api/articles
GET    /api/articles/{article}
PUT    /api/articles/{article}
PATCH  /api/articles/{article}
DELETE /api/articles/{article}
```

Since `articles` is inside the `auth:sanctum` group, all article routes require a Bearer token.

## Recommended API Route Structure

A more practical structure is to make `index` and `show` public, while protecting create/update/delete routes:

```php
Route::prefix('auth')->group(function () {
    Route::post('/register', [UserController::class, 'store']);
    Route::post('/login', [UserController::class, 'login']);
    Route::post('/logout', [UserController::class, 'logout'])
        ->middleware('auth:sanctum');
});

Route::apiResource('articles', ArticleController::class)
    ->only(['index', 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('articles', ArticleController::class)
        ->only(['store', 'update', 'destroy']);

    Route::post('/articles/{article}/paragraphs', [ParagraphController::class, 'store']);
    Route::put('/paragraphs/{paragraph}', [ParagraphController::class, 'update']);
    Route::patch('/paragraphs/{paragraph}', [ParagraphController::class, 'update']);
    Route::delete('/paragraphs/{paragraph}', [ParagraphController::class, 'destroy']);

    Route::post('/articles/{article}/timelines', [TimelineController::class, 'store']);
    Route::put('/timelines/{timeline}', [TimelineController::class, 'update']);
    Route::patch('/timelines/{timeline}', [TimelineController::class, 'update']);
    Route::delete('/timelines/{timeline}', [TimelineController::class, 'destroy']);

    Route::apiResource('users', UserController::class)
        ->only(['update', 'destroy']);
});
```

## Article Request Contract

### Create Article

```text
POST /api/articles
Content-Type: multipart/form-data
Authorization: Bearer TOKEN
Accept: application/json
```

Required fields:

```text
title: string
subtitle: string
type: string
year: numeric
author_id: exists:users,id
cover: image
```

Optional nested fields:

```text
paragraphs: array
paragraphs.*.title: string
paragraphs.*.text: string
paragraphs.*.order: integer

timelines: array
timelines.*.year: numeric
timelines.*.event: string
```

## Sending Nested Arrays in Insomnia

When using `multipart/form-data`, send nested arrays using bracket syntax.

Example:

```text
paragraphs[0][title]   History
paragraphs[0][text]    Kinkaku-ji is one of the most famous Zen temples in Kyoto.
paragraphs[0][order]   1

paragraphs[1][title]   Architecture
paragraphs[1][text]    The top two floors are completely covered in gold leaf.
paragraphs[1][order]   2

timelines[0][year]     1397
timelines[0][event]    The villa was built.

timelines[1][year]     1950
timelines[1][event]    The pavilion was burned down.
```

This lets Laravel automatically convert the fields into arrays.

Avoid sending `paragraphs` and `timelines` as raw JSON strings inside multipart form data unless you manually decode them in `prepareForValidation()`.

## StoreArticleRequest Example

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string'],
        'subtitle' => ['required', 'string'],
        'type' => ['required', 'string'],
        'year' => ['required', 'numeric'],
        'author_id' => ['required', 'exists:users,id'],
        'cover' => ['required', 'image', 'max:104240'],

        'paragraphs' => ['sometimes', 'array'],
        'paragraphs.*.title' => ['required', 'string'],
        'paragraphs.*.text' => ['required', 'string'],
        'paragraphs.*.order' => ['required', 'integer'],

        'timelines' => ['sometimes', 'array'],
        'timelines.*.year' => ['required', 'numeric'],
        'timelines.*.event' => ['required', 'string'],
    ];
}
```

## ArticleController Store Logic

The article should be created first, then paragraphs, timelines, and the cover image should be attached.

Important: remove `cover`, `paragraphs`, and `timelines` from `$data` before calling `Article::create()`.

```php
public function store(StoreArticleRequest $request)
{
    $data = $request->validated();

    $paragraphs = $data['paragraphs'] ?? [];
    $timelines = $data['timelines'] ?? [];

    unset($data['cover'], $data['paragraphs'], $data['timelines']);

    $article = Article::query()->create($data);

    if (!empty($paragraphs)) {
        $article->paragraphs()->createMany($paragraphs);
    }

    if (!empty($timelines)) {
        $article->timelines()->createMany($timelines);
    }

    if ($request->hasFile('cover')) {
        $file = $request->file('cover');

        Storage::disk('s3')->putFileAs(
            "covers/{$article->id}",
            $file,
            'cover.' . $file->getClientOriginalExtension()
        );
    }

    $article->load(['author', 'paragraphs', 'timelines']);

    return (new ArticleResource($article))
        ->additional([
            'msg' => 'Article created successfully',
        ])
        ->response()
        ->setStatusCode(201);
}
```

## S3 Storage

The project stores article cover images in AWS S3.

Current S3 configuration:

```text
Bucket: nikko-temples-bucket
Region: eu-west-3
```

Images are stored using this structure:

```text
covers/{article_id}/cover.{extension}
```

Example:

```text
covers/6/cover.png
covers/7/cover.jpg
```

The required Laravel package is:

```bash
composer require league/flysystem-aws-s3-v3 "^3.0"
```

Basic S3 configuration in `.env`:

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=eu-west-3
AWS_BUCKET=nikko-temples-bucket
AWS_USE_PATH_STYLE_ENDPOINT=true
```

After changing `.env`, always run:

```bash
php artisan optimize:clear
php artisan config:clear
```

Then restart the Laravel server:

```bash
php artisan serve
```

## Testing S3 in Tinker

Run:

```bash
php artisan tinker
```

Then test:

```php
Storage::disk('s3')->put('test.txt', 'hello');
Storage::disk('s3')->files('');
```

Expected successful result:

```php
true
[
    "test.txt"
]
```

## Article Image URL Accessor

The current approach can scan the S3 folder:

```php
public function getImageUrlAttribute(): ?string
{
    $directory = "covers/{$this->id}";

    $files = Storage::disk('s3')->files($directory);

    if (empty($files)) {
        return null;
    }

    return Storage::disk('s3')->url($files[0]);
}
```

This works for a small educational project, but it causes an S3 `ListObjectsV2` request every time the image URL is accessed.

A better long-term solution is to store the image path in the database, for example:

```text
cover_path
```

Then the accessor can simply be:

```php
public function getImageUrlAttribute(): ?string
{
    if (!$this->cover_path) {
        return null;
    }

    return Storage::disk('s3')->url($this->cover_path);
}
```

## ArticleResource

The article resource should return:

```text
id
title
subtitle
year
type
created_at
author
img_url or image_url
paragraphs
timelines
```

Example structure:

```php
return [
    'id' => $this->id,
    'title' => $this->title,
    'subtitle' => $this->subtitle,
    'year' => $this->year,
    'type' => $this->type,
    'created_at' => $this->created_at,

    'author' => $this->whenLoaded('author', function () {
        return [
            'id' => $this->author?->id,
            'name' => $this->author?->name,
        ];
    }),

    'img_url' => $this->image_url,

    'paragraphs' => $this->whenLoaded('paragraphs'),
    'timelines' => $this->whenLoaded('timelines'),
];
```

## UserResource

The user resource should return only safe public fields:

```php
return [
    'id' => $this->id,
    'name' => $this->name,
];
```

Do not generate Sanctum tokens inside `UserResource`.

Tokens should only be created in login or registration logic.

## HTTP Status Codes

Recommended API status codes:

```text
store/create: 201 Created
update: 200 OK
destroy: 204 No Content
invalid credentials: 401 Unauthorized
validation error: 422 Unprocessable Content
not found: 404 Not Found
```

For `destroy()`, prefer:

```php
return response()->noContent();
```

Do not return a JSON body with status `204`.

## Register User Request

```http
POST /api/register
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "name": "admin",
  "password": "password123",
  "password_confirmation": "password123"
}
```

## Login Request

```http
POST /api/login
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "name": "admin",
  "password": "password123"
}
```

Expected response:

```json
{
  "user": {
    "data": {
      "id": 1,
      "name": "admin"
    }
  },
  "token": "1|your_token_here"
}
```

## Create Article With cURL

```bash
curl -i -X POST http://localhost:8000/api/articles \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Kinkaku-ji" \
  -F "subtitle=Golden Pavilion" \
  -F "type=temple" \
  -F "year=1397" \
  -F "author_id=1" \
  -F "cover=@/Users/drobysz/Desktop/header.png" \
  -F "paragraphs[0][title]=History" \
  -F "paragraphs[0][text]=Kinkaku-ji is one of the most famous Zen temples in Kyoto." \
  -F "paragraphs[0][order]=1" \
  -F "paragraphs[1][title]=Architecture" \
  -F "paragraphs[1][text]=The top two floors are completely covered in gold leaf." \
  -F "paragraphs[1][order]=2" \
  -F "timelines[0][year]=1397" \
  -F "timelines[0][event]=The villa was built." \
  -F "timelines[1][year]=1950" \
  -F "timelines[1][event]=The pavilion was burned down." \
  -F "timelines[2][year]=1955" \
  -F "timelines[2][event]=The current structure was rebuilt."
```

The file field must use `@`:

```bash
-F "cover=@/path/to/file.png"
```

Without `@`, curl will send the path as plain text instead of uploading the file.

## Update Article in Insomnia

```http
PUT /api/articles/{article_id}
Authorization: Bearer TOKEN
Accept: application/json
```

Body can be `Multipart Form` if updating the cover image:

```text
title       Updated Kinkaku-ji
subtitle    Updated Golden Pavilion
type        temple
year        1400
author_id   1
cover       File: new-header.png
```

If no image is being updated, JSON can be used if the controller/request supports it:

```json
{
  "title": "Updated Kinkaku-ji",
  "subtitle": "Updated Golden Pavilion",
  "type": "temple",
  "year": 1400,
  "author_id": 1
}
```

## Delete Article in Insomnia

```http
DELETE /api/articles/{article_id}
Authorization: Bearer TOKEN
Accept: application/json
```

No body is required.

Expected response:

```text
204 No Content
```

## Update Paragraph in Insomnia

```http
PUT /api/paragraphs/{paragraph_id}
Authorization: Bearer TOKEN
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "title": "Updated History",
  "text": "Updated paragraph text about the temple history.",
  "order": 1
}
```

## Delete Paragraph in Insomnia

```http
DELETE /api/paragraphs/{paragraph_id}
Authorization: Bearer TOKEN
Accept: application/json
```

No body is required.

## Update Timeline in Insomnia

```http
PUT /api/timelines/{timeline_id}
Authorization: Bearer TOKEN
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "year": 1951,
  "event": "Updated timeline event text."
}
```

## Delete Timeline in Insomnia

```http
DELETE /api/timelines/{timeline_id}
Authorization: Bearer TOKEN
Accept: application/json
```

No body is required.

## Common Debugging Commands

List article routes:

```bash
php artisan route:list --path=api/articles
```

Clear Laravel cache:

```bash
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
```

Restart server:

```bash
php artisan serve
```

Test route with curl:

```bash
curl -i -X POST http://localhost:8000/api/articles \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If the route works but required fields are missing, Laravel should return:

```text
422 Unprocessable Content
```

This means the route and token are valid.


</project-guidelines>

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

</laravel-boost-guidelines>


