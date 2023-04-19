import { ForkChoiceData, ForkChoiceNode } from '@app/types/api';
import { randomHex, randomBigInt, randomInt } from '@utils/functions';

export function equalForkChoiceNode(a?: ForkChoiceNode, b?: ForkChoiceNode) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.slot !== b.slot) return false;
  if (a.block_root !== b.block_root) return false;
  if (a.parent_root !== b.parent_root) return false;
  if (a.weight !== b.weight) return false;
  if (a.validity !== b.validity) return false;
  return true;
}

export function equalForkChoiceData(a?: ForkChoiceData, b?: ForkChoiceData) {
  if (!a || !b) return false;

  // check if nodes length changed
  if (a.fork_choice_nodes?.length !== b.fork_choice_nodes?.length) return false;

  // check checkpoints
  if (a.finalized_checkpoint?.epoch !== b.finalized_checkpoint?.epoch) return false;
  if (a.justified_checkpoint?.epoch !== b.justified_checkpoint?.epoch) return false;

  // check first fork_choice_nodes element
  if (!equalForkChoiceNode(a.fork_choice_nodes?.[0], b.fork_choice_nodes?.[0])) return false;

  const maxNodes = Math.max(a.fork_choice_nodes?.length || 0, b.fork_choice_nodes?.length || 0);

  // check last 10 fork_choice_nodes elements
  for (let i = 0; i < maxNodes; i++) {
    if (
      !equalForkChoiceNode(
        a.fork_choice_nodes?.[a.fork_choice_nodes.length - 1 - i],
        b.fork_choice_nodes?.[b.fork_choice_nodes.length - 1 - i],
      )
    )
      return false;
  }

  return true;
}

export function getCheckpointType(
  blockRoot: string,
  finalizedCheckpoint: string,
  justifiedCheckpoint: string,
): 'finalized' | 'justified' | undefined {
  if (blockRoot === finalizedCheckpoint) {
    return 'finalized';
  } else if (blockRoot === justifiedCheckpoint) {
    return 'justified';
  } else {
    return undefined;
  }
}

export function generateRandomForkChoiceData({
  slotsPerEpoch = 32,
  minSlots = slotsPerEpoch * 3,
  maxSlots = minSlots * 3,
  missedSlotChance = 0.25,
  startingWeight = randomBigInt(0n, BigInt(2) ** BigInt(64)),
  forkChance = 0.2,
  continueForkChance = 0.2,
  invalidChance = 0.05,
}:
  | {
      slotsPerEpoch?: number;
      minSlots?: number;
      maxSlots?: number;
      missedSlotChance?: number;
      startingWeight?: bigint;
      forkChance?: number;
      continueForkChance?: number;
      invalidChance?: number;
    }
  | undefined = {}): ForkChoiceData {
  const totalSlots = randomInt(minSlots, maxSlots);
  const startSlot =
    totalSlots +
    Math.floor(randomInt(slotsPerEpoch, slotsPerEpoch ** 3) / slotsPerEpoch) * slotsPerEpoch;

  const endSlot = startSlot + totalSlots;

  const startEpoch = Math.floor(startSlot / slotsPerEpoch);

  const finalizedCheckpoint = {
    epoch: startEpoch.toString(),
    root: randomHex(64),
  };

  const justifiedCheckpoint = {
    epoch: (startEpoch + 1).toString(),
    root: randomHex(64),
  };

  const forkChoiceNodes: ForkChoiceNode[] = [];

  let currentSlot = startSlot;
  let currentWeight = startingWeight;

  while (currentSlot <= endSlot) {
    const blockRoot = randomHex(64);

    if (currentSlot === startSlot) {
      finalizedCheckpoint.root = blockRoot;
    } else if (currentSlot === startSlot + slotsPerEpoch) {
      justifiedCheckpoint.root = blockRoot;
    } else if (Math.random() < missedSlotChance) {
      currentSlot++;
      continue;
    }

    // const isFork = Math.random() < forkChance;

    const extraData = {
      state_root: randomHex(64),
      justified_root: randomHex(64),
      unrealised_justified_epoch: justifiedCheckpoint.epoch,
      unrealized_justified_root: justifiedCheckpoint.root,
      unrealised_finalized_epoch: finalizedCheckpoint.epoch,
      unrealized_finalized_root: finalizedCheckpoint.root,
    };

    const forkChoiceNode: ForkChoiceNode = {
      slot: currentSlot.toString(),
      block_root: blockRoot,
      parent_root:
        forkChoiceNodes.length > 0
          ? forkChoiceNodes[forkChoiceNodes.length - 1].block_root
          : randomHex(64),
      justified_epoch: justifiedCheckpoint.epoch,
      finalized_epoch: finalizedCheckpoint.epoch,
      weight: currentWeight.toString(),
      validity: invalidChance > Math.random() ? 'INVALID' : 'VALID',
      execution_block_hash: randomHex(64),
      extra_data: extraData,
    };

    forkChoiceNodes.push(forkChoiceNode);

    currentWeight = randomBigInt(currentWeight - 1000n, currentWeight);
    currentSlot++;
  }

  // generate forks
  for (let i = 0; i < forkChoiceNodes.length - 1; i++) {
    if (Math.random() < forkChance) {
      const forkChoiceNode = forkChoiceNodes[i];
      const nextForkChoiceNode = forkChoiceNodes[i + 1];
      const canonicalWeight = BigInt(nextForkChoiceNode.weight);
      const nextWeight = randomBigInt(0n, canonicalWeight);

      let forkedNode = {
        slot: (Number.parseInt(forkChoiceNode.slot) + randomInt(1, 5)).toString(),
        block_root: randomHex(64),
        parent_root: forkChoiceNode.block_root,
        justified_epoch: justifiedCheckpoint.epoch,
        finalized_epoch: finalizedCheckpoint.epoch,
        weight: nextWeight.toString(),
        validity: invalidChance > Math.random() ? 'INVALID' : 'VALID',
        execution_block_hash: randomHex(64),
        extra_data: {
          state_root: randomHex(64),
          justified_root: randomHex(64),
          unrealised_justified_epoch: justifiedCheckpoint.epoch,
          unrealized_justified_root: justifiedCheckpoint.root,
          unrealised_finalized_epoch: finalizedCheckpoint.epoch,
          unrealized_finalized_root: finalizedCheckpoint.root,
        },
      };

      forkChoiceNodes.push(forkedNode);

      let continueForking = Math.random() < continueForkChance;
      while (continueForking) {
        continueForking = Math.random() < continueForkChance;

        forkedNode = {
          slot: (Number.parseInt(forkedNode.slot) + randomInt(1, 5)).toString(),
          block_root: randomHex(64),
          parent_root: forkedNode.block_root,
          justified_epoch: justifiedCheckpoint.epoch,
          finalized_epoch: finalizedCheckpoint.epoch,
          weight: randomBigInt(0n, BigInt(forkedNode.weight)).toString(),
          validity: invalidChance > Math.random() ? 'INVALID' : 'VALID',
          execution_block_hash: randomHex(64),
          extra_data: {
            state_root: randomHex(64),
            justified_root: randomHex(64),
            unrealised_justified_epoch: justifiedCheckpoint.epoch,
            unrealized_justified_root: justifiedCheckpoint.root,
            unrealised_finalized_epoch: finalizedCheckpoint.epoch,
            unrealized_finalized_root: finalizedCheckpoint.root,
          },
        };

        forkChoiceNodes.push(forkedNode);
      }
    }
  }

  return {
    justified_checkpoint: justifiedCheckpoint,
    finalized_checkpoint: finalizedCheckpoint,
    fork_choice_nodes: forkChoiceNodes.sort(
      (a, b) => Number.parseInt(a.slot) - Number.parseInt(b.slot),
    ),
  };
}
