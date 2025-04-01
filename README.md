# Wellington Axe Runners (WAXE)

This is a series of Python scripts run as cron jobs via GitHub Actions. Set to run at the start of every month, Playwright and axe-core will test [wellington.govt.nz](https://wellington.govt.nz), [letstalk.wellington.govt.nz](https://letstalk.wellington.govt.nz), [archivesonline.wcc.govt.nz](https://archivesonline.wcc.govt.nz) and various other Wellington City Council websites on the services.wellington.govt.nz subdomain for common accessibility issues. It records these errors in a CSV for each website, which is then added to a release on GitHub.

## Known issues

- the Playwright tests for Tutuki/services.wellington.govt.nz forms are rushed and very flakey. They need greater assertions.
- CSVs are a bit of a hacky way to store the data. They're not very searchable or filterable, and multiple areas of the same issue are stored in a single cell which makes it hard to read.
- performance. There isn't a lot of performance testing, and the tests are slow to run. Python might not be the best way to do this, but as it is dependent on axe-core I'm unsure the best way to port this to something that supports concurrency like Go.
