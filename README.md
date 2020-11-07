# D&D Audio

## Build using docker
```sh
# Login if necessary
echo "$TOKEN" | docker login -u paullessing --password-stdin docker.pkg.github.com

# Build API
docker build -t docker.pkg.github.com/paullessing/dnd-audio/api:<VERSION> -f apps/api/Dockerfile .
docker push docker.pkg.github.com/paullessing/dnd-audio/api:<VERSION>

# Build Frontend
docker build -t docker.pkg.github.com/paullessing/dnd-audio/frontend:<VERSION> -f apps/frontend/Dockerfile .
docker push docker.pkg.github.com/paullessing/dnd-audio/frontend:<VERSION>
```
