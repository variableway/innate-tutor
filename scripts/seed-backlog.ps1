$ErrorActionPreference = 'Continue'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

function Invoke-Bl {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CmdArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'SilentlyContinue'
  $out = & npx --yes backlog.md@latest @CmdArgs 2>&1 | ForEach-Object { "$_" } | Out-String
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) { throw "backlog failed ($code): $out" }
  return $out
}

function New-BlTask {
  param([string[]]$CmdArgs)
  $out = Invoke-Bl @CmdArgs
  $id = [regex]::Match($out, 'Task (INN-\d+)').Groups[1].Value
  if (-not $id) { throw "No task id in output:`n$out" }
  Write-Host "  + $id"
  return $id
}

Write-Host '== F0 children (Done) =='
Invoke-Bl task edit INN-1 -s Done --check-ac 1 --check-ac 2 --plain | Out-Null

$f0Kids = @(
  @('P0F-01 Pin upstream versions', 'Pin DeepTutor/OpenMAIC/PostgreSQL/LightRAG versions for reproducible local stack.', 'DEEPTUTOR_IMAGE pinned', 'OpenMAIC submodule commit recorded', 'LightRAG image pinned'),
  @('P0F-02 Three logical databases', 'One PostgreSQL instance with innate/openmaic/lightrag databases.', 'Init SQL creates three DBs', 'Each service uses correct DATABASE_URL'),
  @('P0F-03 Independent volumes', 'Separate volumes for OpenMAIC classroom, DeepTutor workspace, optional RAG data.', 'Volumes do not overlap', 'compose down keeps data'),
  @('P0F-04 LLM-only defaults', 'Default mode requires only LLM; Embedding/RAG stay in optional profile; no secrets committed.', 'env.example has no real secrets', 'RAG vars only needed for profile'),
  @('P0F-05 Loopback port binds', 'All host ports bind to 127.0.0.1 only.', 'compose ports are 127.0.0.1'),
  @('P0F-06 Document integration boundaries', 'Document that OpenMAIC does not auto-call RAG and DeepTutor does not auto-use PostgreSQL.', 'quickstart states boundaries'),
  @('P0F-07 Static compose validation', 'Validate default and rag-lightrag profiles for vars/deps/volumes/healthchecks.', 'docker compose config passes', 'rag profile config passes')
)
foreach ($k in $f0Kids) {
  $a = @('task', 'create', $k[0], '-p', 'INN-1', '-m', 'm-0', '-l', 'track-ab,infra', '--type', 'chore', '-s', 'Done', '--plain', '--no-dod-defaults', '-d', $k[1])
  for ($i = 2; $i -lt $k.Count; $i++) { $a += @('--ac', $k[$i]) }
  [void](New-BlTask $a)
}

Write-Host '== Track A parents =='
$f1 = New-BlTask @(
  'task', 'create', 'F1 Generation Smoke',
  '-m', 'm-1', '-l', 'track-a', '--type', 'spike', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Generate and open 3 short courses via OpenMAIC. Record job/course IDs, URLs, latency, model, errors.',
  '--ac', '3/3 classrooms open',
  '--ac', 'job/course/URL/latency/error recorded',
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)
$f2 = New-BlTask @(
  'task', 'create', 'F2 Batch Benchmark',
  '-m', 'm-1', '-l', 'track-a', '--type', 'spike', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Expand to 10 topics/materials with quality rubric and Go/No-Go decision.',
  '--ac', 'JSON/Markdown report produced',
  '--ac', 'Failures classified (provider/gen/schema/media/persist)',
  '--ac', 'Go/No-Go written',
  '--dep', $f1,
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)
$f3 = New-BlTask @(
  'task', 'create', 'F3 Thin Catalog APP',
  '-m', 'm-1', '-l', 'track-a', '--type', 'feature', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Independent thin Catalog app: submit, poll, list, detail, open Player. Store catalog metadata only.',
  '--ac', 'Submit/poll/list/open Player works',
  '--ac', 'Player fault does not take down Catalog',
  '--dep', $f2,
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)
$f4 = New-BlTask @(
  'task', 'create', 'F4 CourseArtifact Baseline',
  '-m', 'm-1', '-l', 'track-a', '--type', 'feature', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Evolve from URL records to versioned CourseArtifact v0 with checksum/asset checks; freeze fixtures for Track B.',
  '--ac', 'CourseArtifact v0 defined',
  '--ac', 'manifest/checksum/asset check passes',
  '--ac', 'immutable CourseVersion fixture for Track B',
  '--dep', $f3,
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)

Write-Host '== Track A children =='
$aKids = @(
  @{ p = $f1; items = @(
      @('P0F-08 Prepare 3 smoke topics', 'Prepare topics: knowledge lecture, with Quiz, with short material.', '3 smoke topics ready'),
      @('P0F-09 Call generate-classroom and poll', 'POST /api/generate-classroom and poll job status.', 'Job reaches terminal status'),
      @('P0F-10 Persist generation records', 'Save job ID, course ID, URL, total latency, model, error type.', 'Records saved for all 3'),
      @('P0F-11 Restart durability check', 'Verify classroom still opens after refresh and container restart.', 'Classroom survives restart')
    ) },
  @{ p = $f2; items = @(
      @('P0F-12 Expand to 10-benchmark + rubric', 'Run 10-sample benchmark with human quality rubric.', '10 samples scored'),
      @('P0F-13 Classify failures', 'Classify failures as provider/generation/schema/media/persistence.', 'Every failure has a class'),
      @('P0F-14 Go/No-Go decision', 'Decide continue / narrow scope / stop for Track A.', 'Signed Go/No-Go note')
    ) },
  @{ p = $f3; items = @(
      @('P0F-15 Catalog metadata-only model', 'New app stores course catalog metadata only; do not copy OpenMAIC state machine.', 'No OpenMAIC internal state duplication'),
      @('P0F-16 Catalog CRUD + open Player', 'Implement submit, poll, list, detail, open Player.', 'All five flows work'),
      @('P0F-17 Catalog isolates Player faults', 'Player faults are identifiable and retryable without crashing Catalog.', 'Fault isolation demonstrated')
    ) },
  @{ p = $f4; items = @(
      @('P0F-18 Define CourseArtifact v0', 'Define envelope: upstream version, course ID, scene metadata, asset refs.', 'Schema documented'),
      @('P0F-19 Snapshot and checksum', 'Save .maic.zip or equivalent manifest/media snapshot with checksum.', 'Checksum reproducible'),
      @('P0F-20 Validate assets and format', 'Validate remote assets, interactive HTML, AV missingness, format version.', 'Validator report produced'),
      @('P0F-21 Freeze CourseVersion fixture', 'Freeze immutable CourseVersion fixture for Track B adapters.', 'Fixture usable by Track B')
    ) }
)
foreach ($group in $aKids) {
  foreach ($item in $group.items) {
    $a = @('task', 'create', $item[0], '-p', $group.p, '-m', 'm-1', '-l', 'track-a', '--type', 'task', '--plain', '--no-dod-defaults', '-d', $item[1], '--ac', $item[2])
    [void](New-BlTask $a)
  }
}

Write-Host '== Track B parents =='
$t1 = New-BlTask @(
  'task', 'create', 'T1 Tutor Standalone no-RAG',
  '-m', 'm-2', '-l', 'track-b', '--type', 'spike', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Configure DeepTutor single-user with one LLM (no KB/Embedding). Validate scene/selection direct-context Q&A.',
  '--ac', '20 baseline questions stream successfully',
  '--ac', 'Failures recorded',
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)
$t2 = New-BlTask @(
  'task', 'create', 'T2 Optional RAG Spike',
  '-m', 'm-2', '-l', 'track-b', '--type', 'spike', '--priority', 'Medium', '--plain', '--no-dod-defaults',
  '-d', 'Enable a retrieval provider only when long-doc/citation needs appear; verify ingest/retrieve + citations.',
  '--ac', 'Citations resolve to source materials',
  '--ac', 'Index survives restart',
  '--dep', $t1,
  '--doc', 'docs/refined/09-optional-rag-provider-strategy.md'
)
$t3 = New-BlTask @(
  'task', 'create', 'T3 Scene-aware Adapter',
  '-m', 'm-2', '-l', 'track-b', '--type', 'feature', '--priority', 'High', '--plain', '--no-dod-defaults',
  '-d', 'Adapter over DeepTutorApp or /api/v1/ws using F4 fixture context; normalize stream/cancel/citation; degrade Player safely.',
  '--ac', 'Browser-forged body never enters trusted prompt',
  '--ac', 'stream/cancel/reconnect/citation/usage normalized',
  '--ac', 'Player continues when Tutor unavailable',
  '--dep', "$t1,$f4",
  '--doc', 'docs/refined/08-fast-validation-parallel-evolution.md'
)

Write-Host '== Track B children =='
$bKids = @(
  @{ p = $t1; items = @(
      @('P0T-01 Configure DeepTutor single-user LLM', 'Single-user mode + one LLM; no KB/Embedding.', 'DeepTutor answers without RAG'),
      @('P0T-02 Scene/selection direct-context Q&A', 'Validate current scene/selection context answers and no-citation boundary.', '20 questions completed with notes')
    ) },
  @{ p = $t2; items = @(
      @('P0T-03 Enable RAG only when needed', 'Choose and enable RAG provider only after long-doc/citation trigger conditions.', 'Provider selection documented'),
      @('P0T-04 Verify retrieval quality', 'Validate top-k, source locator, Chinese questions, and no-answer cases.', 'Retrieval checklist passed')
    ) },
  @{ p = $t3; items = @(
      @('P0T-05 Define trusted context inputs from F4', 'Use F4 fixture: courseVersionId/sceneId/selection/SourceRef.', 'Input contract documented'),
      @('P0T-06 Implement Adapter via stable boundary', 'Use only DeepTutorApp or /api/v1/ws.', 'No unstable internal imports'),
      @('P0T-07 Normalize stream lifecycle', 'Normalize stream/cancel/reconnect/citation/usage.', 'Contract tests green'),
      @('P0T-08 Disable high-risk tools', 'Disable shell, arbitrary MCP, subagent by default.', 'Tool allowlist enforced'),
      @('P0T-09 Player degrades without Tutor', 'OpenMAIC Player keeps playing when Tutor times out/unavailable.', 'Degradation demo recorded')
    ) }
)
foreach ($group in $bKids) {
  foreach ($item in $group.items) {
    $a = @('task', 'create', $item[0], '-p', $group.p, '-m', 'm-2', '-l', 'track-b', '--type', 'task', '--plain', '--no-dod-defaults', '-d', $item[1], '--ac', $item[2])
    [void](New-BlTask $a)
  }
}

Write-Host '== Convergence placeholders =='
[void](New-BlTask @(
  'task', 'create', 'T4 Product Integration Tutor Panel',
  '-m', 'm-3', '-l', 'convergence', '--type', 'feature', '--priority', 'Medium', '--plain', '--no-dod-defaults',
  '-d', 'Join tracks: Tutor Panel, session mapping, citation jump. Course playback must not depend on Tutor.',
  '--ac', 'Playback independent of Tutor',
  '--ac', 'Tutor failure degrades gracefully',
  '--dep', "$f4,$t3",
  '--doc', 'docs/refined/05-implementation-roadmap.md'
))
[void](New-BlTask @(
  'task', 'create', 'T5 Production Data identity events progress',
  '-m', 'm-3', '-l', 'convergence', '--type', 'feature', '--priority', 'Low', '--plain', '--no-dod-defaults',
  '-d', 'Identity, LearningEvent, progress, audit, budget. Enter only after G4 product gate.',
  '--ac', 'Cross-user negative tests pass',
  '--ac', 'Replay and recovery pass',
  '--doc', 'docs/refined/05-implementation-roadmap.md'
))

Write-Host '== Summary =='
Invoke-Bl milestone list
Invoke-Bl task list --plain
Write-Host 'Seed complete.'
