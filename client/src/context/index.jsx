// this is place where we are gonna wrap all web3 logic and then wrap our application with this contex so that every single page and component can use it without any problem..


import React, { useContext, createContext } from 'react';
import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

import {EditionMetadataWithOwnerOutputSchema} from '@thirdweb-dev/sdk'; 



const StateContext = createContext();


//() in the const fun is called as props

export const StateContextProvider = ({ children }) => {

  //connecting to smart contract

  const { contract } = useContract('0xB3f86f0981ab96AAd5dCb0548FFb9bC2a8316A0a');
  //contract address


  //calling the write function...creating the compaign from the web3 smart contract and passing all the parameters into it...'createCamapign' is our write func name
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();//adress of the smart wallet
  const connect = useMetamask();//connecting the smart wallet


  //form data created in the react is now uploading to the smart contract web3 
  const publishCampaign = async (form) => {
    try {
      //below everything is done in the order as the contract.sol created

      const data = await createCampaign([
        address, // owner
        form.title, // title
        form.description, // description
        form.target,
        new Date(form.deadline).getTime(), // deadline,
        form.image
      ])

      console.log("contract call success", data)
    } catch (error) {
      console.log("contract call failure", error)
    }
  }

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));
    return parsedCampaings;
  }

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

    return filteredCampaigns;
  }

  const donate = async (pId, amount) => {
    const data = await contract.call('donateToCampaign', pId, { value: ethers.utils.parseEther(amount)});

    return data;
  }

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', pId);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for(let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      })
    }

    return parsedDonations;
  }


  return (
    // value includes everything what we wanted to share in across all of the components 

    <StateContext.Provider
      value={{ 
        address,
        contract,
        connect,
        createCampaign: publishCampaign,//rename publish to create
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
      {/* render the children */}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext);