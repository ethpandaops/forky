package forkchoice

import (
	"context"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

var (
	testDBCounter = 0
)

func newTestServer(withConfig string) (Server, error) {
	// create mock log object
	log := logrus.New()

	port := 5555 + testDBCounter
	dsn := fmt.Sprintf("file:%v?mode=memory&cache=shared", testDBCounter)

	// create a new configuration
	cfg := fmt.Sprintf(
		`listen_addr: ":%d"
log_level: "debug"
metrics:
  enabled: false

forky:
  retention_period: 24h
  store:
    type: "memory"
  indexer:
    driver_name: "sqlite"
    dsn: "%s"
`, port, dsn)

	if withConfig != "" {
		cfg = withConfig
	}

	config, err := NewConfigFromYAML([]byte(cfg))
	if err != nil {
		return Server{}, err
	}

	testDBCounter++

	svc := NewServer(log, config)

	return *svc, nil
}

func TestForkChoiceServer(t *testing.T) {
	t.Run("Add a random frame", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		frame := types.GenerateFakeFrame()
		err = s.svc.AddNewFrame(context.Background(), "fake", frame)
		assert.NoError(t, err)
	})

	t.Run("Add and get a frame", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		frame := types.GenerateFakeFrame()
		err = s.svc.AddNewFrame(context.Background(), "fake", frame)
		assert.NoError(t, err)

		// query the frame
		f, err := s.svc.GetFrame(context.Background(), frame.Metadata.ID)
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.ID, f.Metadata.ID)
	})

	t.Run("Add and list a frame", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		frame := types.GenerateFakeFrame()
		err = s.svc.AddNewFrame(context.Background(), "fake", frame)
		assert.NoError(t, err)

		// query the frame
		f, _, err := s.svc.ListMetadata(context.Background(), &service.FrameFilter{
			Node: &frame.Metadata.Node,
		}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.ID, f[0].ID)
	})

	t.Run("Add and list a frame by its metadata types", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		frame := types.GenerateFakeFrame()
		err = s.svc.AddNewFrame(context.Background(), "fake", frame)
		assert.NoError(t, err)

		// query the frame
		f, _, err := s.svc.ListNodes(context.Background(), &service.FrameFilter{
			Node: &frame.Metadata.Node,
		}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.Node, f[0])

		f, _, err = s.svc.ListLabels(context.Background(), &service.FrameFilter{
			Node: &frame.Metadata.Node,
		}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.Labels[0], f[0])

		epochs, _, err := s.svc.ListEpochs(context.Background(), &service.FrameFilter{
			Node: &frame.Metadata.Node,
		}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.WallClockEpoch, epochs[0])

		slots, _, err := s.svc.ListSlots(context.Background(), &service.FrameFilter{
			Node: &frame.Metadata.Node,
		}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, frame.Metadata.WallClockSlot, slots[0])
	})

	t.Run("Pagination", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		//nolint:gosec // This is a test function.
		framesToCreate := rand.Intn(500)
		for i := 0; i < framesToCreate; i++ {
			f := types.GenerateFakeFrame()
			err = s.svc.AddNewFrame(context.Background(), "fake", f)
			assert.NoError(t, err)
		}

		// query the frame
		_, page, err := s.svc.ListMetadata(context.Background(), &service.FrameFilter{}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, page.Total, int64(framesToCreate))
	})

	t.Run("Retention period purging", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		s.Cfg.Forky.RetentionPeriod.Duration = 1 * time.Second

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		//nolint:gosec // This is a test function.
		framesToCreate := rand.Intn(500)
		for i := 0; i < framesToCreate; i++ {
			f := types.GenerateFakeFrame()
			err = s.svc.AddNewFrame(context.Background(), "fake", f)
			assert.NoError(t, err)
		}

		time.Sleep(5 * time.Second)
		err = s.svc.DeleteOldFrames(context.Background())
		assert.NoError(t, err)

		// query the frame
		_, page, err := s.svc.ListMetadata(context.Background(), &service.FrameFilter{}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, int64(0), page.Total)
	})

	t.Run("Add and delete frames", func(t *testing.T) {
		s, err := newTestServer("")
		assert.NoError(t, err)

		go func() {
			err = s.Start(context.Background())
			assert.NoError(t, err)
		}()

		time.Sleep(1 * time.Second)

		//nolint:gosec // This is a test function.
		framesToCreate := rand.Intn(500)
		for i := 0; i < framesToCreate; i++ {
			f := types.GenerateFakeFrame()
			err = s.svc.AddNewFrame(context.Background(), "fake", f)
			assert.NoError(t, err)
		}

		frames, page, err := s.svc.ListMetadata(context.Background(), &service.FrameFilter{}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, page.Total, int64(framesToCreate))
		assert.Equal(t, len(frames), framesToCreate)

		for _, f := range frames {
			err = s.svc.DeleteFrame(context.Background(), f.ID)
			assert.NoError(t, err)
		}

		// query the frame
		newFrames, page, err := s.svc.ListMetadata(context.Background(), &service.FrameFilter{}, *service.DefaultPagination())
		assert.NoError(t, err)
		assert.Equal(t, page.Total, int64(0))
		assert.Equal(t, len(newFrames), 0)
	})
}
