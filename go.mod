module github.com/ethpandaops/forky

go 1.19

replace github.com/attestantio/go-eth2-client v0.16.3 => github.com/samcm/go-eth2-client v0.15.12

require (
	github.com/attestantio/go-eth2-client v0.16.3
	github.com/aws/aws-sdk-go-v2 v1.17.6
	github.com/aws/aws-sdk-go-v2/credentials v1.13.17
	github.com/aws/aws-sdk-go-v2/service/s3 v1.30.6
	github.com/aws/smithy-go v1.13.5
	github.com/cenkalti/backoff/v4 v4.2.1
	github.com/creasty/defaults v1.7.0
	github.com/ethpandaops/ethwallclock v0.3.0
	github.com/ethpandaops/xatu v0.0.86
	github.com/glebarez/sqlite v1.9.0
	github.com/go-co-op/gocron v1.27.1
	github.com/google/uuid v1.3.0
	github.com/jellydator/ttlcache/v3 v3.0.1
	github.com/julienschmidt/httprouter v1.3.0
	github.com/lib/pq v1.10.9
	github.com/pkg/errors v0.9.1
	github.com/prometheus/client_golang v1.16.0
	github.com/rs/zerolog v1.29.0
	github.com/sirupsen/logrus v1.9.3
	github.com/spf13/cobra v1.7.0
	github.com/stretchr/testify v1.8.2
	google.golang.org/protobuf v1.31.0
	gopkg.in/DATA-DOG/go-sqlmock.v1 v1.3.0
	gopkg.in/yaml.v2 v2.4.0
	gorm.io/driver/postgres v1.5.0
	gorm.io/gorm v1.25.2
	gorm.io/plugin/prometheus v0.0.0-20230109022219-ee24990c7392
)

require (
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.4.10 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.30 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.4.24 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.0.22 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.9.11 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.1.25 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.9.24 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.13.24 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/fatih/color v1.14.1 // indirect
	github.com/ferranbt/fastssz v0.1.3 // indirect
	github.com/glebarez/go-sqlite v1.21.2 // indirect
	github.com/go-playground/validator/v10 v10.11.1 // indirect
	github.com/goccy/go-yaml v1.9.8 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.3.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/klauspost/cpuid/v2 v2.2.4 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.18 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.4 // indirect
	github.com/minio/sha256-simd v1.0.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_model v0.4.0 // indirect
	github.com/prometheus/common v0.44.0 // indirect
	github.com/prometheus/procfs v0.11.1 // indirect
	github.com/prysmaticlabs/go-bitfield v0.0.0-20210809151128-385d8c5e3fb7 // indirect
	github.com/r3labs/sse/v2 v2.10.0 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	golang.org/x/crypto v0.11.0 // indirect
	golang.org/x/net v0.10.0 // indirect
	golang.org/x/sync v0.3.0 // indirect
	golang.org/x/sys v0.10.0 // indirect
	golang.org/x/text v0.11.0 // indirect
	golang.org/x/xerrors v0.0.0-20220907171357-04be3eba64a2 // indirect
	google.golang.org/genproto v0.0.0-20230306155012-7f2fa6fef1f4 // indirect
	google.golang.org/grpc v1.55.0 // indirect
	gopkg.in/cenkalti/backoff.v1 v1.1.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	modernc.org/libc v1.22.5 // indirect
	modernc.org/mathutil v1.5.0 // indirect
	modernc.org/memory v1.5.0 // indirect
	modernc.org/sqlite v1.23.1 // indirect
)
