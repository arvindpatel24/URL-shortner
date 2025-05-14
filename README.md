# Features
1. Url shortner with handling of duplicate urls
2. Database sharding with consistent hashing
3. Database indexing

## Tools Used
1. Node.js
2. Postgres
3. Docker

## Steps to Run - 
1. Clone the repo
2. Run - docker run --name pgshard1 -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d pgshard
3. Run - docker run --name pgshard2 -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d pgshard
4. Run - docker run --name pgshard3 -e POSTGRES_PASSWORD=postgres -p 5434:5432 -d pgshard
5. npm run start
