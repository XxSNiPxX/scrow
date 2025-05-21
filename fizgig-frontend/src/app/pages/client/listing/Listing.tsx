import React, { useState, useEffect } from 'react';
import './listing.scss';
import { Scroll } from 'folds';
import { ChatWindow } from '../../../components/chat-window-listing/chat-window';
import axios from 'axios';

interface SpaceData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorUsername: string;
  color: string;
  letter: string;
  images: string[];
  price: number;
  type: string;
  createdAt: string;
  room:string;
}
interface Link {
  AddedAt: string;
  ID: string;
  Notes: string;
  ProductID: string;
  Room: string;
  UserID: string;
  User: {
    ID: string;
    Username: string;
    CreatedAt: string;
    // Add any other relevant fields if needed
  };
}

interface Chat {
  id: string;
  user: string;
  lastMessage: string;
}

const dummyChats: Chat[] = [
  { id: 'c1', user: 'Alice', lastMessage: 'Is it still available?' },
  { id: 'c2', user: 'Bob', lastMessage: 'Can you lower the price?' },
];

export const Listing: React.FC = () => {
  const [listings, setListings] = useState<SpaceData[]>([]);
  const [selectedListing, setSelectedListing] = useState<SpaceData | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
const [links, setLinks] = useState<Link[]>([]);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.post('http://localhost:8086/get-my-products', {
          access_token: localStorage.getItem('cinny_access_token'),
        });

        if (response.data?.products) {
          console.log(response.data)
          const formattedListings = response.data.products.map((product: any): SpaceData => ({
            id: product.ID,
            name: product.Name,
            description: product.Description,
            creatorId: product.CreatorID,
            creatorUsername: product.Creator?.Username || 'Unknown',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            letter: product.Name?.charAt(0)?.toUpperCase() || '?',
            images: product.ImageURLs || [],
            price: product.Price,
            type: product.Type,
            createdAt: product.CreatedAt,
          }));
          setListings(formattedListings);
        } else {
          console.log('No products found');
        }
        if (response.data.links) {
    setLinks(response.data.links);
  }
      } catch (error: any) {
        console.error('Error fetching product link:', error.response?.data || error.message);
      }
    };

    fetchProducts();
  }, []);

  console.log(links,"selectedChat")
  const handleBack = () => {
    setSelectedListing(null);
    setSelectedChat(null);
  };

  return (
    <Scroll hideTrack visibility="Hover">
      <div className="dashboard">
        <div className="dashboard__content">
          <div className="dashboard__cards">
            {selectedListing === null ? (
              listings.map((listing) => (
                <div key={listing.id} className="card">
                  <div className="card__images">
                    {(listing.images.length > 0 ? listing.images : ['https://via.placeholder.com/300']).map(
                      (img, index) => (
                        <div key={index} className="card__image_container">
                          <img src={img} alt={listing.name} className="card__image" />
                        </div>
                      )
                    )}
                  </div>
                  <div className="card__icon" style={{ backgroundColor: listing.color }}>
                    {listing.letter}
                  </div>
                  <div className="card__content">
                    <div className="card__name">{listing.name}</div>
                    <div className="card__identifier">{listing.type}</div>
                    <div className="card__description">{listing.description}</div>
                    <button
                      className="card__button"
                      onClick={() => {
                        setSelectedListing(listing);
                        setSelectedChat(null);
                      }}
                    >
                      View Chats
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-section">
                <button className="dashboard__back_button" onClick={handleBack}>
                  ← Back
                </button>
                <h2 className="dashboard__section_title">Chats for "{selectedListing.name}"</h2>
                <div className="chat-window">
    <div className="chat-list">
      <h3>Users</h3>
      {links
        .filter(link => link.ProductID === selectedListing?.id)
        .map((link) => (
          <div
            key={link.ID}
            onClick={() =>
              setSelectedChat(link)
            }
            className={`chat-item ${selectedChat?.id === link.ID ? 'selected' : ''}`}
          >
          {console.log(link)}

            <div style={{ fontWeight: 600 }}>{link.UserName || 'Unknown'}</div>
          </div>
        ))}
    </div>
    <div className="chat-box">
      {selectedChat ? (
        <>
          <h3>Chat with {selectedChat.UserName}</h3>
          <div className="chat-messages">
            <ChatWindow roomId={selectedChat.Room} />
          </div>
        </>
      ) : (
        <div className="no-chat">Select a chat to view messages</div>
      )}
    </div>
  </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </Scroll>
  );
};
