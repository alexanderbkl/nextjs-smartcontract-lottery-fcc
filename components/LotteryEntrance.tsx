import { useCallback, useEffect, useRef, useState } from "react"
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { abi, contractAddresses } from "../constants"
import { useNotification } from "web3uikit";
import { BigNumber, ethers, ContractTransaction } from "ethers"

interface contractAddressesInterface {
    [key: string]: string[]
}

const LotteryEntrance = () => {
    const addresses: contractAddressesInterface = contractAddresses
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis()
    const chainId: string = parseInt(chainIdHex!).toString()
    const raffleAddress = chainId in addresses ? addresses[chainId][0] : ""
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [provider, setProvider] = useState<ethers.providers.Provider>(null!)
    const [nonce, setNonce] = useState(0)
    const [raffleState, setRaffleState] = useState("0")
    const dispatch = useNotification()
    const [mounted, setMounted] = useState(false)

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "enterRaffle",
        params: {
            nonce: nonce,
        },
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getRecentWinner",
        params: {},
    })



    const updateUI = useCallback(async () => {
        const entranceFee = await getEntranceFee()
        let entranceFeeFromCall = "0.01"
        if (entranceFee) {
            entranceFeeFromCall = (entranceFee as BigNumber).toString()
        }
        const numPlayersFromCall = ((await getNumberOfPlayers()) as BigNumber).toString()
        const recentWinnerFromCall = (await getRecentWinner()) as string
        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
    }, [getEntranceFee, getNumberOfPlayers, getRecentWinner])

    useEffect(() => {
        if (isWeb3Enabled && raffleAddress && (window as any)?.ethereum) {
            const localProvider = new ethers.providers.Web3Provider((window as any).ethereum);
            setProvider(localProvider)
//@ts-ignore
            const contract = new ethers.Contract(raffleAddress, abi, localProvider);

            const handleEvent = async (requestId: any) => {
                console.log("RequestedRaffleWinner", requestId)
                await updateUI();
                const raffleState = await contract.getRaffleState()
                setRaffleState(raffleState.toString())
                if (mounted) {
                    dispatch({
                        type: "info",
                        title: "Raffle Winner Requested",
                        message: "A raffle winner has been requested",
                        position: "topR",
                        icon: "bell",
                    })
                }
                setMounted(true)
            }

            contract.on("RequestedRaffleWinner", handleEvent);

            setMounted(true)
        }
    }, [isWeb3Enabled, raffleAddress, updateUI]);

    const handleSuccess = async function (tx: ContractTransaction) {
        await tx.wait(1)
        handleNewNotification()
        updateUI()
    }

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            title: "Transaction Sent",
            message: "Your transaction has been sent to the blockchain",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            LotteryEntrance
            {raffleAddress ? (
                <div className="">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async () => {
                            //const signer = provider.getSigner()
                            const nonce = await provider.getTransactionCount((window as any).ethereum.selectedAddress)
                            setNonce(nonce)
                            await enterRaffle({
                                onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
                                onError: (err) => console.log(err),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div>Raffle State: {raffleState}</div>
                    <div>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div>
                    <div>Number of players: {numPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No raffle address detected</div>
            )}
        </div>
    );
}

export default LotteryEntrance;