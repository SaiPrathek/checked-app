# University directory

`us-universities.json` contains the unique names of United States institutions
from the open-source [Hipo University Domains List](https://github.com/Hipo/university-domains-list),
retrieved on 2026-07-13. The Check-In combobox also accepts a manually entered
institution because no third-party directory can guarantee perfect coverage.

`university-geo.json` maps matching names to city and state using the U.S.
Department of Education's NCES/IPEDS 2024 Directory Information file (`HD2024`),
retrieved on 2026-07-14. Check-In derives region and climate locally from that
location; unmatched institutions use the one-tap region fallback.
