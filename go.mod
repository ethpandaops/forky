module github.com/ethpandaops/forky

go 1.26.8

replace github.com/probe-lab/hermes => github.com/ethpandaops/hermes v0.0.4-0.20250715094801-db6021d1c703

require (
	github.com/aws/aws-sdk-go-v2 v1.39.6
	github.com/aws/aws-sdk-go-v2/credentials v1.18.16
	github.com/aws/aws-sdk-go-v2/service/s3 v1.88.4
	github.com/aws/smithy-go v1.23.2
	github.com/cenkalti/backoff/v4 v4.3.0
	github.com/creasty/defaults v1.8.0
	github.com/ethpandaops/ethwallclock v0.4.0
	github.com/ethpandaops/xatu v1.24.4-0.20261007033258-20c9c651e62c
	github.com/glebarez/sqlite v1.10.0
	github.com/go-co-op/gocron v1.37.0
	github.com/go-faster/errors v0.7.1
	github.com/go-faster/jx v1.2.0
	github.com/google/uuid v1.6.0
	github.com/jellydator/ttlcache/v3 v3.4.1
	github.com/ogen-go/ogen v1.20.3
	github.com/prometheus/client_golang v1.24.1
	github.com/rs/zerolog v1.34.0
	github.com/sirupsen/logrus v1.9.4
	github.com/spf13/cobra v1.10.1
	github.com/stretchr/testify v1.12.1
	go.opentelemetry.io/otel v1.46.0
	go.opentelemetry.io/otel/metric v1.46.0
	go.opentelemetry.io/otel/trace v1.46.0
	google.golang.org/protobuf v1.36.12
	gopkg.in/DATA-DOG/go-sqlmock.v1 v1.3.0
	gopkg.in/yaml.v2 v2.4.0
	gorm.io/driver/postgres v1.5.4
	gorm.io/gorm v1.25.5
	gorm.io/plugin/prometheus v0.1.0
)

require (
	github.com/OffchainLabs/go-bitfield v0.0.0-20260504143531-5cbb6d0f5f2e // indirect
	github.com/ProjectZKM/Ziren/crates/go-runtime/zkvm_runtime v0.0.0-20251001021608-1fe7b43fc4d6 // indirect
	github.com/huandu/go-assert v1.1.6 // indirect
	github.com/ncruces/go-strftime v0.1.9 // indirect
	github.com/pk910/hashtree-bindings v0.2.6 // indirect
	github.com/planetscale/vtprotobuf v0.6.1-0.20240319094008-0393e58bdf10 // indirect
	go.yaml.in/yaml/v3 v3.0.5 // indirect
)

require (
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.7.1 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.4.9 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.7.9 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.4.9 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.13.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.9.0 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.13.9 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.19.9 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.4.1 // indirect
	github.com/dlclark/regexp2 v1.11.5 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/ethereum/go-ethereum v1.17.6 // indirect
	github.com/ethpandaops/go-eth2-client v0.1.9-0.20261007031839-0b35f0981d55
	github.com/fatih/color v1.19.0 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/glebarez/go-sqlite v1.22.0 // indirect
	github.com/go-faster/yaml v0.4.6 // indirect
	github.com/go-logr/logr v1.4.4 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/goccy/go-yaml v1.19.2 // indirect
	github.com/google/pprof v0.0.0-20251002213607-436353cc1ee6 // indirect
	github.com/holiman/uint256 v1.3.2 // indirect
	github.com/huandu/go-clone v1.7.3 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.7.6 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/klauspost/cpuid/v2 v2.4.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.22 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/pk910/dynamic-ssz v1.3.3-0.20260921152246-990798fa9718 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/prometheus/client_model v0.6.2 // indirect
	github.com/prometheus/common v0.70.1 // indirect
	github.com/prometheus/procfs v0.21.1 // indirect
	github.com/r3labs/sse/v2 v2.10.0 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/segmentio/asm v1.2.1 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/spf13/pflag v1.0.10 // indirect
	go.opentelemetry.io/auto/sdk v1.2.1 // indirect
	go.opentelemetry.io/otel/sdk/metric v1.46.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	go.uber.org/zap v1.28.0 // indirect
	golang.org/x/crypto v0.56.0 // indirect
	golang.org/x/exp v0.0.0-20260718201538-764159d718ef // indirect
	golang.org/x/mod v0.39.0 // indirect
	golang.org/x/net v0.58.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
	golang.org/x/text v0.41.0 // indirect
	golang.org/x/tools v0.49.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260819154853-08b0e4226688 // indirect
	google.golang.org/grpc v1.83.2 // indirect
	gopkg.in/cenkalti/backoff.v1 v1.1.0 // indirect
	modernc.org/libc v1.66.10 // indirect
	modernc.org/mathutil v1.7.1 // indirect
	modernc.org/memory v1.11.0 // indirect
	modernc.org/sqlite v1.39.1 // indirect
)

tool github.com/ogen-go/ogen/cmd/ogen
