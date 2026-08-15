# Local development only — production builds are static output shipped to S3/CloudFront,
# the frontend never runs as a container in production (see docs/diagrams/production-aws.svg).
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
