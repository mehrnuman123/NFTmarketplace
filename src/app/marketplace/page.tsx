// src/app/discover/closet/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
  getAssetsByOwner,
  fetchNFTDetails,
  extractGroupAddress,
} from "@/utils/getAssets";
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface NFTDetail {
  name: string;
  symbol: string;
  image?: string;
  group?: string;
  mint: string;
  seller: string;
  price: number;
  listing: string;
}

const trimAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

const Closet: React.FC = () => {
  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [assets, setAssets] = useState<NFTDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [searchQuery, setSearchQuery] = useState("");
  const [nfts, setNfts] = useState<NFTDetail[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [maxPrice, setMaxPrice] = useState<number>(0);


  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(true);
  };

  useEffect(() => {
    const storedWalletAddress = sessionStorage.getItem("walletAddress");
    const storedAssets = sessionStorage.getItem("assets");

    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }

    if (storedAssets) {
      setAssets(JSON.parse(storedAssets));
    }
    fetchNFTs();
  }, []);

  // useEffect(() => {
  //   fetchAssets();
  // }, [publicKey]);

  useEffect(() => {
    fetchNFTs();
  }, [wallet]);

  useEffect(() => {
    sessionStorage.setItem("walletAddress", walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    sessionStorage.setItem("assets", JSON.stringify(assets));
    if (searchQuery) {
      const filteredItems = assets.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setNfts(filteredItems.length > 0 ? filteredItems : []);
    } else {
      setNfts(assets)
    }

    if (maxPrice > 0) {
      const filteredNFTs = nfts.filter(nft => nft.price <= maxPrice);
      setNfts(filteredNFTs)
    }

  }, [searchQuery, maxPrice, assets]);

  const fetchNFTs = async () => {
    setIsLoading(true);
    const provider = new AnchorProvider(connection, wallet as Wallet, {});

    try {
      const listings = await getNFTList(provider, connection);
      // const mint = new PublicKey(listings[0].mint);
      // const detail = await getNFTDetail(mint, connection);
      const promises = listings
        .filter((list) => list.isActive)
        .map((list) => {
          const mint = new PublicKey(list.mint);
          return getNFTDetail(
            mint,
            connection,
            list.seller,
            list.price,
            list.pubkey
          );
        });
      const detailedListings = await Promise.all(promises);
      //return detailedListings;

      setAssets(detailedListings);
    } catch (errr) {
      console.log(errr);
    } finally {
      setIsLoading(false);
    }
  };


  const closeFilter = () => {
    setIsDropdownOpen(false)
  }
  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">

      <div className="relative flex items-center justify-between px-4 py-2">
        <span className="text-3xl font-bold mb-4 text-left text-black dark:text-white">
          NFTs on sale
        </span>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-4 z-10">

              <button
                onClick={closeFilter}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                aria-label="Close"
              >
                ✕
              </button>

              <span className="text-xl font-bold mb-4 text-left text-black dark:text-white mb-4">
                Name
              </span>
              <input
                id="search"
                type="text"
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xl font-bold mb-4 text-left text-black dark:text-white mb-4">
                Max Price
              </span>
              <input
                id="search"
                type="text"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nfts.map((asset: NFTDetail) => (
            <div
              key={asset.mint}
              className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
            >
              <Link href={`/marketplace/${asset.mint}`}>
                <div className="relative h-64 w-full mb-4">
                  {asset.image ? (
                    <Image
                      src={asset.image}
                      alt={`Asset ${asset.mint}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  ) : (
                    <p>No Image Available</p>
                  )}
                </div>
              </Link>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                <p className="font-semibold">{asset.name || "Unknown"}</p>
                <Link
                  href={`https://solana.fm/address/${asset.mint}`}
                  target="_blank"
                  className="hover:text-gray-300 flex items-center"
                >
                  {trimAddress(asset.mint)}{" "}
                  <FaExternalLinkAlt className="ml-1" />
                </Link>
                {asset.group && (
                  <Link
                    href={`https://solana.fm/address/${asset.group}`}
                    target="_blank"
                    className="hover:text-gray-300 flex items-center"
                  >
                    Group: {trimAddress(asset.group)}{" "}
                    <FaExternalLinkAlt className="ml-1" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
          No NFTs on sale
        </h2>
      )}
    </div>
  );
};

export default Closet;
