# Changelog

## [0.5.0](https://github.com/artenanagara/zenko-web/compare/v0.4.2...v0.5.0) (2026-08-24)


### Features

* add an admin-facing tutor directory ([0ab1a70](https://github.com/artenanagara/zenko-web/commit/0ab1a706d77a20bc5b812af20a6a068b6b532d74))
* disable tutor pricing and skip QRIS for Rp0 checkout ([14c9eb9](https://github.com/artenanagara/zenko-web/commit/14c9eb988dcd3d36befadc9679c3105862d2ba9f))
* free packages, subtest simulation, pembahasan, and profile layout ([51543c4](https://github.com/artenanagara/zenko-web/commit/51543c4cd8c192503549d62587b43fa994b36907))
* let an account change its email, and give the footer a compact form ([3fec2c1](https://github.com/artenanagara/zenko-web/commit/3fec2c1f8ddca2d34bdf71e225135a23cbd33b30))
* let tutors and admins simulate a subtest in the real exam room ([078d3be](https://github.com/artenanagara/zenko-web/commit/078d3be9a8aa350c543f8f25faa9eac215cf4a3d))
* mirror the tutor pricing rule in the product wizard ([ab2433f](https://github.com/artenanagara/zenko-web/commit/ab2433f253edc23fd6ecc0514f4449e7fc53c0ce))
* refresh site copywriting across account, dashboard, and marketing pages ([d60d73a](https://github.com/artenanagara/zenko-web/commit/d60d73a81155a48d226493f89e0f0d3b466635bd))
* reveal the pembahasan after finishing a try out sitting ([fcaf4d8](https://github.com/artenanagara/zenko-web/commit/fcaf4d87e0b2bf7cffde668c368ddda3b8510170))
* show a zero price as "Gratis" and keep free orders readable ([50519c1](https://github.com/artenanagara/zenko-web/commit/50519c110461afb0e34198812fbcdab753a1de45))
* split the admin tutor detail page into profil and produk tabs ([9218991](https://github.com/artenanagara/zenko-web/commit/921899154a98251421c3c01b2639fba1c00e7e16))


### Bug Fixes

* crop logo.png to remove its lopsided transparent padding ([23257c0](https://github.com/artenanagara/zenko-web/commit/23257c0954ae16136f538ed939ab02ddacb1f931))
* crop logo.png to remove lopsided transparent padding ([0b1493f](https://github.com/artenanagara/zenko-web/commit/0b1493f976fad62dfd8751cd6af6c482c02cb71e))
* finish a free-sample sitting through the API grader ([e305780](https://github.com/artenanagara/zenko-web/commit/e305780597c97bf5919b37d60fb238d0829f4dc7))
* scope the popular-search assertion to the hero ([dab455d](https://github.com/artenanagara/zenko-web/commit/dab455dc9dfd69c906eb5f7a36d5ddb34f69af9e))
* stop the dashboard sidebar hydrating stale hrefs for admins ([bfbf83b](https://github.com/artenanagara/zenko-web/commit/bfbf83b8f81883f0585e93a4ec0fd10facfb4332))

## [0.4.2](https://github.com/artenanagara/zenko-web/compare/v0.4.1...v0.4.2) (2026-08-23)


### Bug Fixes

* build before archiving .output in the release bundle ([70e4e59](https://github.com/artenanagara/zenko-web/commit/70e4e59144b8054c844193cf80b91976617f2502))

## [0.4.1](https://github.com/artenanagara/zenko-web/compare/v0.4.0...v0.4.1) (2026-08-23)


### Bug Fixes

* authenticate the release job to GitHub Packages ([8decade](https://github.com/artenanagara/zenko-web/commit/8decade28fd6dcc4e93d9b7a0252a18182bcea48))

## [0.4.0](https://github.com/artenanagara/zenko-web/compare/v0.3.0...v0.4.0) (2026-08-23)


### Features

* make the invoice the durable home for a purchase ([b7d20d5](https://github.com/artenanagara/zenko-web/commit/b7d20d552a8c5e284b28f1a30f07c7ee81cb0eb2))

## [0.3.0](https://github.com/artenanagara/zenko-web/compare/v0.2.0...v0.3.0) (2026-08-23)


### Features

* add a rich text editor to the tutor question form ([c628a99](https://github.com/artenanagara/zenko-web/commit/c628a99e3fec47f54eaeffa81fd4ea8a793f294a))
* add delete action to tutor product list ([315d849](https://github.com/artenanagara/zenko-web/commit/315d849fd148296c114eb026178ead385d4f838d))
* add Instagram and TikTok links to the footer ([5ba1584](https://github.com/artenanagara/zenko-web/commit/5ba15841e1e959058728459fd7ddc84b2b3df104))
* apply the new Zenko logo across the app ([6fc8287](https://github.com/artenanagara/zenko-web/commit/6fc828714dd626d8e7d1cd8a05f0e7421a42d1ea))
* give QRIS payment its own dedicated page ([8e132ef](https://github.com/artenanagara/zenko-web/commit/8e132efac24554a6689646e407d6cc019026898b))
* split OTP verification into per-digit boxes with a confirming state ([8d0ff51](https://github.com/artenanagara/zenko-web/commit/8d0ff51b5865a82efb3223070c11d0bdafffe0a6))
* switch email verification to a 6-digit OTP ([c39cdc0](https://github.com/artenanagara/zenko-web/commit/c39cdc01d8c1092880e3b9c0b311d61a6266094c))
* switch to a filled icon set across the app ([be76afb](https://github.com/artenanagara/zenko-web/commit/be76afbaf6f9bc94b45099ffdb8b4919d915d2ef))
* wire checkout to real Midtrans QRIS payments ([abaa5c2](https://github.com/artenanagara/zenko-web/commit/abaa5c28a6c115b1126eccbe33273333cddb899a))


### Bug Fixes

* always show the mock-data notice on the purchases page ([20aefa5](https://github.com/artenanagara/zenko-web/commit/20aefa5b59a22bdce7a48fc82db603e42145df2a))
* drop login/signup links from the footer, tidy remaining columns ([0867ff1](https://github.com/artenanagara/zenko-web/commit/0867ff19956396b67123bc99ba56b3ad242eff7d))
* show the full logo lockup instead of icon plus live text ([1cc1ade](https://github.com/artenanagara/zenko-web/commit/1cc1ade4a78ba7e89453ace2cc97488a70d57623))

## [0.2.0](https://github.com/artenanagara/zenko-web/compare/v0.1.0...v0.2.0) (2026-08-13)


### Features

* enable email authentication and HTTPS ([55b07e7](https://github.com/artenanagara/zenko-web/commit/55b07e7777273810018a6eaaf2de9efa9a18f4e7))
* redesign dashboard sidebar and wire tutor earnings ([0048cd6](https://github.com/artenanagara/zenko-web/commit/0048cd6bc803bb6c5f661a7f715877ff9b721a29))


### Bug Fixes

* refresh role before dashboard access ([c281d7e](https://github.com/artenanagara/zenko-web/commit/c281d7e090ee162fe84b3bdcf05d1f2a42c81699))

## Changelog

Perubahan penting pada zenko-web dicatat di sini. File ini dikelola otomatis
oleh Release Please berdasarkan Conventional Commits.
