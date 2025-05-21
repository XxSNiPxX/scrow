'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { RoomEvent } from 'matrix-js-sdk';
import { RoomView } from '../../features/room/RoomView';
import { Room } from '../../features/room';
import * as roomActions from '../../../client/action/room';
import axios from 'axios'; // Make sure axios is installed or use fetch()
import { PowerLevelsContextProvider, usePowerLevels } from '../../hooks/usePowerLevels';
import { RoomProvider } from '../../hooks/useRoom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  creator: string;
  createdAt: string;
  type: string;
}

interface ChatWindowProps {
  product: Product;
}

function RoomWithPowerLevels({ room }: { room: any }) {
  const powerLevels = usePowerLevels(room);
console.log(powerLevels)
  return (
    <PowerLevelsContextProvider value={powerLevels}>
      <Room />
    </PowerLevelsContextProvider>
  );
}

export function ChatWindow({ product }: ChatWindowProps) {
  const mx = useMatrixClient();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [room, setRoom] = useState<any>(null);

  // Generate a safe alias string based on the product name
  const generateAlias = (prod: Product) => {
    const safeName = prod.name.toLowerCase().replace(/[^a-z0-9=._-]+/g, '_');
    return `#product_${safeName}_test_1252111:test.domain`;
  };
  const generateAliasName = (prod: Product) => {
    const safeName = prod.name.toLowerCase().replace(/[^a-z0-9=._-]+/g, '_');
    return `product_${safeName}_test_1252111`;
  };
  console.log(room)

  // Create or get the room when mx or product changes
  useEffect(() => {
    if (!mx || !product || creating || roomId) return;

    let mounted = true;
    const alias = generateAlias(product);
    const aliasName = generateAliasName(product);
    console.log(alias,aliasName,"aliasName")

    async function getOrCreateRoom() {
      setCreating(true);
      setError(null);

      try {
        // Try to get room by alias
        // throw "Error"
        // const existingRoomId = await mx.getRoomIdForAlias(alias);
        // console.log(existingRoomId,"in getor create checking room")
        let room;
        try {
          const response = await axios.post('http://localhost:8086/get-product-link', {
            access_token: localStorage.getItem("cinny_access_token"),
            product_id: product.id,
          });

        if (response.data && response.data.link) {
          console.log("UserProductLink found:", response.data.link);
          room=response.data.link.Room
        } else {
          console.log("No link found");
          throw "Error"

        }
      } catch (error) {
        console.error("Error fetching product link:", error.response?.data || error.message);
        throw "Error"

      }

        const foundRoom = await mx.getRoom(room);
        console.log(foundRoom,"found")
        setRoom(foundRoom);

        setRoomId(room);
        setCreating(false);
        if (!mounted) return;

      } catch (e) {
        // Room alias not found, create it
        console.log(e,"error")
        try {
          const roomData = await roomActions.createRoom(mx, {
            name: `Private Chat for ${product.name}`,
            topic: "test",
            joinRule: 'invite',
            alias: aliasName, // Remove leading '#' when creating alias
            isEncrypted: true,
            powerLevel: 101,
            isSpace: false,
            parentId: null,
          });

          console.log(roomData,"RROOM1")

          console.log(roomData,product,"RROOM")

          // Invite a user - adjust the user ID accordingly
          await mx.invite(roomData.room_id, product.creator);
          console.log(roomData,"RROOM")

          try{
            await axios.post('http://localhost:8086/start-chat', {
            access_token: localStorage.getItem("cinny_access_token"),
            product_id: product.id,
            room: roomData.room_id,
            notes: `Chat started for product: ${product.name}`,
          });
        }catch(e){
          console.log(e,"error in send")
        }


          console.log(roomData,"RROOM")
          setRoomId(roomData.room_id);
          if (!mounted) return;

        } catch (err: any) {
          console.log(err)
          if (!mounted) return;
          setError(err.message || 'Failed to create room');
        }
      } finally {
        if (mounted) setCreating(false);
      }
    }

    getOrCreateRoom();

    return () => {
      mounted = false;
    };
  }, [mx, product, creating, roomId]);

  // Load room object after roomId is set
  // useEffect(() => {
  //   console.log("in here",roomId)
  //   if (!mx || !roomId) return;
  //   let foundRoom
  //   try{
  //     foundRoom = mx.getRoom("!aZhCqovkfeJVKvupTb");
  //
  //   }
  //   catch(e){
  //     console.log(e)
  //   }
  //   console.log(foundRoom,"here")
  //   setRoom(foundRoom);
  // }, [mx, roomId]);

console.log(creating)
  // Display loading/errors
  if (creating) return <div>Creating private chat room...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!room) return <div>Initializing...</div>;

  return (
    <RoomProvider key={room.roomId} value={room}>
      <RoomWithPowerLevels room={room} />
    </RoomProvider>
  );
}

export default ChatWindow;
