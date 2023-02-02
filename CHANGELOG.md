# [2.0.0-next.1](https://github.com/jaredLunde/form-atoms/compare/v1.3.0-next.3...v2.0.0-next.1) (2023-02-02)

### Code Refactoring

- upgrade to jotai v2 ([#29](https://github.com/jaredLunde/form-atoms/issues/29)) ([e533e40](https://github.com/jaredLunde/form-atoms/commit/e533e409a3de1a35affd0e61fcdb41259cdb4039)), closes [#27](https://github.com/jaredLunde/form-atoms/issues/27) [#28](https://github.com/jaredLunde/form-atoms/issues/28) [#18](https://github.com/jaredLunde/form-atoms/issues/18) [#17](https://github.com/jaredLunde/form-atoms/issues/17)

### BREAKING CHANGES

- Renames form and field hooks to exclude "Atom" and be more terse. Renames most
  exported types and several type signatures.

# [1.3.0-next.3](https://github.com/jaredLunde/form-atoms/compare/v1.3.0-next.2...v1.3.0-next.3) (2023-01-29)

### Features

- add zod validator ([#23](https://github.com/jaredLunde/form-atoms/issues/23)) ([06ca2c4](https://github.com/jaredLunde/form-atoms/commit/06ca2c450b13d8ca8f0c9b5cacf1fc75cc172d9f))

# [1.3.0-next.2](https://github.com/jaredLunde/form-atoms/compare/v1.3.0-next.1...v1.3.0-next.2) (2023-01-28)

### Bug Fixes

- fix package entries ([#24](https://github.com/jaredLunde/form-atoms/issues/24)) ([a18cfc5](https://github.com/jaredLunde/form-atoms/commit/a18cfc5e006f88477de4bea13ed9116b6c5ac14b))

# [1.3.0-next.1](https://github.com/jaredLunde/form-atoms/compare/v1.2.5...v1.3.0-next.1) (2023-01-28)

### Bug Fixes

- fix release ([#22](https://github.com/jaredLunde/form-atoms/issues/22)) ([a4fff3b](https://github.com/jaredLunde/form-atoms/commit/a4fff3bba4b28adaf17886a95361aff3705f8c8e))

### Features

- update build scripts and tests ([#21](https://github.com/jaredLunde/form-atoms/issues/21)) ([b242e02](https://github.com/jaredLunde/form-atoms/commit/b242e0265a5c1e9930219a901a8103b063f3d53a))

## [1.2.5](https://github.com/jaredLunde/form-atoms/compare/v1.2.4...v1.2.5) (2022-08-07)

### Bug Fixes

- **types:** fix types for Field component ([#13](https://github.com/jaredLunde/form-atoms/issues/13)) ([cdc1917](https://github.com/jaredLunde/form-atoms/commit/cdc1917d8857db78df4e3d3466133ce0abde7484)), closes [#11](https://github.com/jaredLunde/form-atoms/issues/11)

## [1.2.4](https://github.com/jaredLunde/form-atoms/compare/v1.2.3...v1.2.4) (2022-05-02)

### Bug Fixes

- fix generic type for useFormProps ([#10](https://github.com/jaredLunde/form-atoms/issues/10)) ([49cd58b](https://github.com/jaredLunde/form-atoms/commit/49cd58b371bd9ddfcc2855e444b2aaddbcf56e80))

## [1.2.3](https://github.com/jaredLunde/form-atoms/compare/v1.2.2...v1.2.3) (2022-02-21)

### Bug Fixes

- submit needs a startTransition so there are no race conditions w/ validation ([#7](https://github.com/jaredLunde/form-atoms/issues/7)) ([bde6fb9](https://github.com/jaredLunde/form-atoms/commit/bde6fb9d840a4f6efef8c521456305aeef18f131))

## [1.2.2](https://github.com/jaredLunde/form-atoms/compare/v1.2.1...v1.2.2) (2022-02-21)

### Bug Fixes

- fix dynamic field reading in walk ([#6](https://github.com/jaredLunde/form-atoms/issues/6)) ([a27d5e3](https://github.com/jaredLunde/form-atoms/commit/a27d5e3eefe43dde1ea0f9f8edb32db66211146e))

## [1.2.1](https://github.com/jaredLunde/form-atoms/compare/v1.2.0...v1.2.1) (2022-02-20)

### Bug Fixes

- validation should be skipped if undefined is returned ([#5](https://github.com/jaredLunde/form-atoms/issues/5)) ([4fd91a5](https://github.com/jaredLunde/form-atoms/commit/4fd91a52f3958d3e303c18ef493a71b0c274a636))

# [1.2.0](https://github.com/jaredLunde/form-atoms/compare/v1.1.2...v1.2.0) (2022-02-20)

### Features

- add field and form components ([#4](https://github.com/jaredLunde/form-atoms/issues/4)) ([ca6d60e](https://github.com/jaredLunde/form-atoms/commit/ca6d60eb79fd1c6a42214708b8f7c2d5fbdef667))

## [1.1.2](https://github.com/jaredLunde/form-atoms/compare/v1.1.1...v1.1.2) (2022-02-19)

### Bug Fixes

- fix missing scope in field reset ([949d710](https://github.com/jaredLunde/form-atoms/commit/949d710ef851403fe10f65958e8091ea2f1be336))

## [1.1.1](https://github.com/jaredLunde/form-atoms/compare/v1.1.0...v1.1.1) (2022-02-18)

### Bug Fixes

- write docs ([#3](https://github.com/jaredLunde/form-atoms/issues/3)) ([ba61ea2](https://github.com/jaredLunde/form-atoms/commit/ba61ea2fbc7f0ec39ba1ffd5c8136e8d38d52984))

# [1.1.0](https://github.com/jaredLunde/form-atoms/compare/v1.0.0...v1.1.0) (2022-02-18)

### Bug Fixes

- fix build ([18ea8a0](https://github.com/jaredLunde/form-atoms/commit/18ea8a03fad11b20122f715bbfbfa580f821ad3c))

### Features

- make an atomic form library ([#2](https://github.com/jaredLunde/form-atoms/issues/2)) ([6f02270](https://github.com/jaredLunde/form-atoms/commit/6f02270e8ea873bfbe8b000a500202c609492dc6))

# 1.0.0 (2022-02-14)

### Features

- get it started ([1e57560](https://github.com/jaredLunde/form-atoms/commit/1e575605dacdb1dbb8a8b97b55de9d53b87a992c))
