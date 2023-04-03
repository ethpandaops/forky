import { renderHook, waitFor } from '@testing-library/react';

import { getNow, networkName, spec } from '@app/mocks/handlers';
import {
  useSpecQuery,
  useNowQuery,
  useFrameQuery,
  useMetadataQuery,
  useNodesQuery,
} from '@hooks/useQuery';
import { ProviderWrapper } from '@utils/testing';

describe('useQuery', () => {
  describe('useNowQuery', () => {
    it('should return current slot and epoch', async () => {
      const { result } = renderHook(() => useNowQuery(), {
        wrapper: ProviderWrapper,
      });

      const now = getNow();

      await waitFor(() => result.current.isSuccess);
      await waitFor(() => expect(result.current.data?.slot).toEqual(now.slot));
      await waitFor(() => expect(result.current.data?.epoch).toEqual(now.epoch));
    });
  });

  describe('useNowQuery', () => {
    it('should return metadata', async () => {
      const { result } = renderHook(() => useSpecQuery(), {
        wrapper: ProviderWrapper,
      });

      await waitFor(() => result.current.isSuccess);
      await waitFor(() => expect(result.current.data?.network_name).toEqual(networkName));
      await waitFor(() => expect(result.current.data?.spec).toEqual(spec));
    });
  });

  describe('useMetadataQuery', () => {
    it('should return metadata', async () => {
      const { result } = renderHook(() => useMetadataQuery({}), {
        wrapper: ProviderWrapper,
      });

      await waitFor(() => result.current.isSuccess);
      await waitFor(() => expect(result.current.data?.length).toBeGreaterThan(0));
    });
  });

  describe('useNodeQuery', () => {
    it('should return nodes', async () => {
      const { result } = renderHook(() => useNodesQuery({}), {
        wrapper: ProviderWrapper,
      });

      await waitFor(() => result.current.isSuccess);
      await waitFor(() => expect(result.current.data?.length).toBeGreaterThan(0));
    });
  });

  describe('useFrameQuery', () => {
    it('should return the frame metadata id', async () => {
      const { result } = renderHook(() => useFrameQuery('123'), {
        wrapper: ProviderWrapper,
      });

      await waitFor(() => result.current.isSuccess);
      await waitFor(() => expect(result.current.data?.frame.metadata.id).toEqual('123'));
    });
  });
});
