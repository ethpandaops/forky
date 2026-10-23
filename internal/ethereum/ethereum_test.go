package ethereum

import (
	"testing"
	"time"

	"github.com/ethpandaops/ethwallclock"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewBeaconChain_ValidConfig_ReturnsBeaconChain(t *testing.T) {
	config := &Config{
		Network: NetworkConfig{
			Name: "TestNet",
			Spec: SpecConfig{
				SlotsPerEpoch:  32,
				SlotDurationMs: 12000,
				GenesisTime:    1590832934,
			},
		},
	}
	log := logrus.New()
	beaconchain, err := NewBeaconChain(log, config)
	require.NoError(t, err)
	assert.NotNil(t, beaconchain)
}

func TestNewBeaconChain_InvalidConfig_ReturnsError(t *testing.T) {
	config := &Config{}
	log := logrus.New()
	beaconchain, err := NewBeaconChain(log, config)
	require.Error(t, err)
	assert.Nil(t, beaconchain)
}

func TestBeaconChain_Wallclock_ReturnsEthereumBeaconChain(t *testing.T) {
	config := &Config{
		Network: NetworkConfig{
			Name: "TestNet",
			Spec: SpecConfig{
				SlotsPerEpoch:  32,
				SlotDurationMs: 12000,
				GenesisTime:    1590832934,
			},
		},
	}
	log := logrus.New()
	beaconchain, _ := NewBeaconChain(log, config)
	wallclock := beaconchain.Wallclock()
	assert.NotNil(t, wallclock)
	assert.IsType(t, &ethwallclock.EthereumBeaconChain{}, wallclock)
}

func TestBeaconChain_SlotsPerEpoch_ReturnsSlotsPerEpoch(t *testing.T) {
	config := &Config{
		Network: NetworkConfig{
			Name: "TestNet",
			Spec: SpecConfig{
				SlotsPerEpoch:  32,
				SlotDurationMs: 12000,
				GenesisTime:    1590832934,
			},
		},
	}
	log := logrus.New()
	beaconchain, _ := NewBeaconChain(log, config)
	slotsPerEpoch := beaconchain.SlotsPerEpoch()
	assert.Equal(t, uint64(32), slotsPerEpoch)
}

func TestBeaconChain_SlotDurationMs_ReturnsSlotDurationMs(t *testing.T) {
	config := &Config{
		Network: NetworkConfig{
			Name: "TestNet",
			Spec: SpecConfig{
				SlotsPerEpoch:  32,
				SlotDurationMs: 12000,
				GenesisTime:    1590832934,
			},
		},
	}
	log := logrus.New()
	beaconchain, _ := NewBeaconChain(log, config)
	slotDurationMs := beaconchain.SlotDurationMs()
	assert.Equal(t, uint64(12000), slotDurationMs)
}

func TestBeaconChain_Wallclock_FollowsHezeSlotDuration(t *testing.T) {
	config := &Config{
		Network: NetworkConfig{
			Name: "TestNet",
			Spec: SpecConfig{
				SlotsPerEpoch:      32,
				SlotDurationMs:     12000,
				GenesisTime:        1590832934,
				HezeForkEpoch:      5,
				SlotDurationMsHeze: 9000,
			},
		},
	}
	log := logrus.New()
	beaconchain, err := NewBeaconChain(log, config)
	require.NoError(t, err)

	forkTime := beaconchain.GenesisTime().Add(160 * 12 * time.Second)
	slot, epoch, err := beaconchain.Wallclock().FromTime(forkTime.Add(18799 * 9 * time.Second))
	require.NoError(t, err)
	assert.Equal(t, uint64(18959), slot.Number())
	assert.Equal(t, uint64(592), epoch.Number())
}
