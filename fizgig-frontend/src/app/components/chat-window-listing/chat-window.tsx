'use client';

import React, { useEffect, useState } from 'react';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { PowerLevelsContextProvider, usePowerLevels } from '../../hooks/usePowerLevels';
import { RoomProvider } from '../../hooks/useRoom';
import { Room } from '../../features/room';

interface ChatWindowProps {
  roomId: string;
}

function RoomWithPowerLevels({ room }: { room: any }) {
  const powerLevels = usePowerLevels(room);

  return (
    <PowerLevelsContextProvider value={powerLevels}>
      <Room />
    </PowerLevelsContextProvider>
  );
}

export function ChatWindow({ roomId }: ChatWindowProps) {
  const mx = useMatrixClient();
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
  if (!mx || !roomId) return;

  const fetchRoom = async () => {
    try {
      console.log("HEREEE")
      const fetchedRoom = await mx.getRoom(roomId); // ← if it's async
      const membership = await fetchedRoom?.getMyMembership(); // returns 'invite', 'join', etc.
      if (membership === 'invite') {
        await mx.joinRoom(roomId);
      }
      console.log(membership)
      console.log(fetchedRoom);
      setRoom(fetchedRoom);
    } catch (err) {
      console.error('Failed to fetch room:', err);
    }
  };

  fetchRoom();
}, [mx, roomId]);

  if (!room) return <div>Loading chat room...</div>;

  return (
    <RoomProvider key={room.roomId} value={room}>
      <RoomWithPowerLevels room={room} />
    </RoomProvider>
  );
}

export default ChatWindow;
