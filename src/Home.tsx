import {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import * as anchor from '@project-serum/anchor';

import styled from 'styled-components';
import {Container, Snackbar} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Alert from '@material-ui/lab/Alert';
import {PublicKey} from '@solana/web3.js';
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletDialogButton} from '@solana/wallet-adapter-material-ui';
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from './candy-machine';
import {AlertState} from './utils';
import {Header} from './Header';
import {MintButton} from './MintButton';
import {GatewayProvider} from '@civic/solana-gateway-react';

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const MintContainer = styled.div``; // add your owns styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

const Home = (props: HomeProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  const [isUserMinting, setIsUserMinting] = useState(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: undefined,
  });

  const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const refreshCandyMachineState = useCallback(async () => {
    if (!anchorWallet) {
      return;
    }

    if (props.candyMachineId) {
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );
        setCandyMachine(cndy);
      } catch (e) {
        console.log('There was a problem fetching Candy Machine state');
        console.log(e);
      }
    }
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const onMint = async () => {
    try {
      setIsUserMinting(true);
      document.getElementById('#identity')?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = {err: true};
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            true
          );
        }

        if (status && !status.err) {
          setAlertState({
            open: true,
            message: 'Congratulations! Mint succeeded!',
            severity: 'success',
          });
        } else {
          setAlertState({
            open: true,
            message: 'Mint failed! Please try again!',
            severity: 'error',
          });
        }
      }
    } catch (error) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsUserMinting(false);
    }
  };

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    props.connection,
    refreshCandyMachineState,
  ]);

  useEffect(() => {
    if (ref !== null && ref.current !== null) {
      const handleVideo = async (): Promise<void> => {
        const video: any = await document.querySelector('.js-video');
        await ref.current?.play();
        await video?.play();
        video.loop = true;
        video.autoplay = true;
      };
      handleVideo();
    }
  }, [ref]);

  return (
    <>
      {/* @ts-ignore */}
      <style jsx>
        {`
          @import url('http://fonts.cdnfonts.com/css/media-gothic');
          iframe {
            display: none;
          }
          .bg-header {
            background: url('./Just_concrete_optimized.png') no-repeat top
              center;
            background-size: cover;
          }
          .jitb-bg {
            // background: url('https://cdn.discordapp.com/attachments/905542266549047336/950136697591574618/Just_concrete_optimized.png')
            //   no-repeat top center;
            // background-size: cover;
            // border-radius: 0.5rem;
            background-color: #ededed;
          }
          .header-h {
            height: 500px;
          }
          body {
            margin: 0;
            background-color: RGB(255, 255, 255) !important;
            margin: 0 auto;
          }
          .fnt {
            font-family: 'Media Gothic', -apple-system, BlinkMacSystemFont,
              'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
              'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          code {
            font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
              monospace;
          }
          p {
            font-size: 1.25rem;
          }
          .punk-font {
            font-size: 2.75rem;
          }
          .Punks-Evolved-container {
            min-height: 37.5rem;
          }

          .stay-involved {
            height: 100%;
            height: 43.75rem;
          }
          .stay-involved p {
            font-size: 1.5rem;
          }
          .socials {
            min-height: 500px;
            background-color: #ef4116;
          }
          .style-btn {
            height: 3.6875rem;
            font-size: 1rem;
            width: 12.75rem;
            text-align: center;
            justify-content: center;
          }
          .progress {
            max-width: 50rem;
            width: 100%;
            margin: 0 auto;
          }
          .mint-input {
            z-index: 2;
            background-color: rgba(0, 0, 0, 0.25);
          }
          .mint-section-icons {
            z-index: 2;
            padding: 0.1875rem 1rem;
          }

          .logo {
            height: 100%;
            min-height: 25rem;
            max-height: 50rem;
            left: 0;
          }
          .zin-1 {
            z-index: 1;
          }
          .js-font {
            min-width: 18.75rem;
            max-height: 50rem;
            z-index: 2;
          }
          .js-font img {
            font-family: 'Baskerville Old Face' !important;
            color: #ad0000;
            text-align: center;
          }
          .preview-gif {
            max-height: 18.75rem;
            max-width: 18.75rem;
          }
          .logo img {
            object-fit: cover;
          }
          svg {
            width: 2rem;
            height: 2rem;
            color: #fff;
            margin: 0.3125rem;
          }
          .collage-img {
            min-height: 360px;
            min-width: 22.5rem;
            max-width: 75rem;
          }
          .nft-percent {
            z-index: 5;
            color: #000;
            background-color: transparent;
          }
          .fnt-color-main {
            color: #ef4116;
          }
          .bg-color-main {
            background-color: #ef4116;
          }
          .w-90 {
            width: 70% !important;
          }
          .h-90 {
            height: 70% !important;
          }
          .icon-size {
            max-width: 25rem;
            max-height: 25rem;
            width: 100%;
            height: 100%;
          }
          .mw-360 {
            max-width: 22.5rem;
          }
          .bar {
            height: 0.1875rem;
            max-width: 66%;
            width: 100%;
            background-color: #000;
          }
          .s-bar {
            height: 0.1875rem;
            max-width: 33%;
            width: 100%;
            background-color: #000;
          }
          . {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
          }
          .section-wrap {
            padding-left: 15%;
            padding-right: 15%;
          }
          @media screen and (max-width: 1200px) {
            .mint-section-box,
            .header-section,
            .logo-xl {
              height: 100%;
              min-height: 62.5rem;
              max-height: 75rem;
            }
          }
          @media screen and (max-width: 768px) {
            .header-section {
              background: url('https://cdn.discordapp.com/attachments/905542266549047336/930576006455111691/banner_for_minting_website.jpg')
                no-repeat top right;
              background-size: cover;
            }
          }
          @media screen and (max-width: 576px) {
            .mint-section-box,
            .header-section,
            .logo-xl {
              height: 100%;
              min-height: 50rem;
              max-height: 75rem;
            }
            .header-section {
              background: url('https://cdn.discordapp.com/attachments/905542266549047336/930576006455111691/banner_for_minting_website.jpg')
                no-repeat top right;
              background-size: cover;
            }
            p {
              font-size: 1.15rem;
            }
            .roadmap {
              min-height: 37rem;
            }
          }
        `}
      </style>

      <div className='bg-header header-h d-flex flex-column flex-md-row align-items-center justify-content-start justify-content-md-around mb-5'>
        <div className='col-10 col-md-4 px-3 order-1 order-md-0'>
          <div className='mw-360 w-100'>
            {!wallet.connected ? (
              <ConnectButton>Connect Wallet</ConnectButton>
            ) : (
              <>
                <Header candyMachine={candyMachine} />
                <MintContainer>
                  {candyMachine?.state.isActive &&
                  candyMachine?.state.gatekeeper &&
                  wallet.publicKey &&
                  wallet.signTransaction ? (
                    <GatewayProvider
                      wallet={{
                        publicKey:
                          wallet.publicKey ||
                          new PublicKey(CANDY_MACHINE_PROGRAM),
                        //@ts-ignore
                        signTransaction: wallet.signTransaction,
                      }}
                      gatekeeperNetwork={
                        candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                      }
                      clusterUrl={rpcUrl}
                      options={{autoShowModal: false}}>
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isUserMinting}
                        onMint={onMint}
                      />
                    </GatewayProvider>
                  ) : (
                    <MintButton
                      candyMachine={candyMachine}
                      isMinting={isUserMinting}
                      onMint={onMint}
                    />
                  )}
                </MintContainer>
              </>
            )}
          </div>
        </div>
        <div className='col-10 col-md-4  d-flex justify-content-center justify-content-md-end p-0 pe-md-5 order-0 order-md-1 align-items-center'>
          <img className=' w-90 h-90' src='./metawares.png' />
        </div>
        {/* </Paper> */}
      </div>
      {/* SECTION TWO ABOUT */}
      <div className='d-flex flex-column justify-content-center align-items-center my-5 section-wrap'>
        <h3 className='py-4 mb-4 fnt fnt-color-main text-center '>
          Understanding Metawares
        </h3>
        <div className='bar'></div>
        <br />
        <div className='s-bar'></div>
        <div className='d-flex flex-column flex-md-row align-items-center justify-content-between justify-content-md-center pt-3 pb-5'>
          <img
            className='col-12 col-sm-8 col-md-4 my-3'
            src='https://cdn.discordapp.com/attachments/905542266549047336/950190179912667166/Implement_Blurb-01.png'
          />
          <img
            className='col-12 col-sm-8 col-md-4 my-3'
            src='https://cdn.discordapp.com/attachments/905542266549047336/950190180197892116/Mint_Blurb-01-01.png'
          />
          <img
            className='col-12 col-sm-8 col-md-4 my-3'
            src='https://cdn.discordapp.com/attachments/905542266549047336/950190180453724180/Trade_Blurb-01.png'
          />
        </div>
      </div>
      {/* SECTION THREE ROADMAP */}
      <div
        className={`roadmap mx-auto d-flex flex-row justify-content-center
            align-items-center my-5`}>
        <img
          className={`text-center w-100 h-100 d-flex d-lg-none`}
          src={
            'https://cdn.discordapp.com/attachments/905542266549047336/946346356396675102/Roadmap_squared_optimized_for_mobile.png'
          }
          alt='roadmap'
        />
        <img
          className={`text-center w-100 h-100 d-none d-lg-flex`}
          src={
            'https://cdn.discordapp.com/attachments/905542266549047336/946346425292316682/Roadmap_Banner_optimized_and_clipped_for_web.png'
          }
          alt='roadmap'
        />
      </div>
      {/* SECTION FOUR PUNKS */}
      <div className='section-wrap'>
        <div
          className={`container-fluid d-flex flex-column flex-md-row justify-content-between align-items-center py-5 my-4`}>
          <div className={`d-flex flex-column col col-md-8`}>
            <h1 className={`punk-font fnt-color-main mb-5 fnt`}>
              Punks Evolved
            </h1>

            <p className=''>
              <span className=''>
                The genesis project to our ecosystem and the airdrop access card
                to all of our projects, the first of which was Jack In The
                Blocks. Punks Evolved Holders will also receive a MetaWares
                market Card as an airdrop after the snapshot taken some time
                after our sale. Punks Evolved also serves as one of our three
                utility NFTs which grants a{' '}
              </span>
              <span className=''>30%</span>{' '}
              <span className=''>
                allocation to MetaWares Market royalties.
              </span>
            </p>

            <div
              className={`d-flex flex-row flex-wrap justify-content-center align-items-center fnt`}>
              <a
                className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 p-4`}
                href={'http://discord.gg/s99MhhmttM'}>
                Discord
              </a>
              <a
                className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 m-2 p-4`}
                href={'https://www.magiceden.io/marketplace/punks_evolved'}>
                Magic Eden
              </a>
              <a
                className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 m-2 p-4`}
                href={'https://twitter.com/punksevolved'}>
                Twitter
              </a>
            </div>
          </div>
          <img
            src='./Punk_Icon.png'
            className='icon-size col-4 my-5 ms-3 ms-md-5'
          />
        </div>
      </div>
      {/* SECTION FIVE JACKS*/}
      <div
        className={`container-fluid jitb-bg d-flex flex-column flex-md-row justify-content-between align-items-center section-wrap py-5 my-5`}>
        <img
          src='./Jacks_Icon.png'
          className='icon-size col-4 my-5 me-3 me-md-5'
        />
        <div className={`d-flex flex-column col col-md-8`}>
          <h1 className={`punk-font my-5 fnt-color-main fnt`}>
            Jack in The Blocks?
          </h1>
          <p>
            <span className='ft'>
              The second project in our ecosystem and the first airdrop to Punks
              Evolved holders. Owning a Jack is owning a AAA 3 D project with
              the lowest mint price on Solana, as well as utility incentives via
              a 10% royalty allocation to MetaWares Marketplace.
            </span>
          </p>

          <div
            className={`d-flex flex-row flex-wrap justify-content-center align-items-center`}>
            <a
              className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 p-4 fnt`}
              href={'http://discord.gg/s99MhhmttM'}>
              Discord
            </a>
            <a
              className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 m-2 p-4 fnt`}
              href={'https://jacksevolved.io/'}>
              Mint
            </a>
            <a
              className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 m-2 p-4 fnt`}
              href={'https://twitter.com/punksevolved'}>
              Twitter
            </a>
          </div>
        </div>
      </div>
      {/* SECTION SIX MORE */}
      <div className='d-flex flex-column justify-content-center align-items-center py-5 section-wrap'>
        <h1 className={` mb-5 fnt-color-main text-center fnt`}>
          A DEEPER COMPREHENSIVE
        </h1>
        <div className='bar'></div>
        <br />
        <div className='s-bar'></div>
        <div
          className={`container-fluid d-flex flex-column flex-md-row justify-content-around align-items-center px-3 px-md-5 py-5 my-4`}>
          <div className={`d-flex flex-column col col-md-6`}>
            <p className=''>
              Our Third and final project in our ecosystem, airdropped to Punks
              Evolved Holders after our snapshot post whitelist sale.
            </p>
            <p>
              <span className=''>Owning a card grants</span>{' '}
              <span className=''>65%</span>{' '}
              <span className=''>
                royalty allocation to all aftermarket fees generated on
                MetaWares marketplace, airdropped automatically each week.
              </span>
            </p>
            <p>
              <span className=''>
                It will also secure you to all future benefits the marketplace
                holds such as{' '}
              </span>{' '}
              <span className=''>3</span>
              <span className=''>
                D video tutorials, special access mints, and more.
              </span>
            </p>

            <div
              className={`d-flex flex-row flex-wrap justify-content-center align-items-center fnt`}>
              <a
                className={`style-btn d-flex flex-row align-items-center btn bg-color-main text-white text-uppercase my-4 m-2 p-4`}
                href={'https://punksevolved.io/'}>
                Read Article
              </a>
            </div>
          </div>
          <video
            ref={ref}
            loop
            className='js-video icon-size col-4 ms-0 ms-md-5'>
            {' '}
            <source
              src='https://ipfs.io/ipfs/QmXY9fwcT6p7wMhvUrBBgF9A96dn4SEzaWpy1BAKGUX7Bp'
              type='video/mp4'
            />
          </video>
        </div>
      </div>
      {/* SOCIAL ICONS */}
      <div
        className={`container-fluid socials d-flex flex-column 
            align-items-center px-3 px-md-5`}>
        <h1 className='text-white mt-5 pt-5 pb-5 fnt'>Stay involved</h1>
        <div
          className={`d-flex flex-column flex-md-row  flex-wrap justify-content-around align-items-center fnt`}>
          <a
            className={`style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2`}
            href={'https://jackintheblocks.io'}>
            Mint A Jack
          </a>
          <a
            className={`style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2`}
            href={'https://discord.gg/s99MhhmttM'}>
            Discord
          </a>
          <a
            className={`style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2`}
            href={'https://twitter.com/MetaWaresMarket'}>
            Twitter
          </a>
          <a
            className={`style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2`}
            href={'https://www.magiceden.io/marketplace/punks_evolved'}>
            Magic Eden
          </a>
        </div>
      </div>
      <div className={`d-flex flex-row justify-content-start px-4 mt-5`}>
        <p className={`m-0 py-3 `}>© COPYRIGHT METAWARES MARKETPLACE 2022</p>
      </div>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({...alertState, open: false})}>
        <Alert
          onClose={() => setAlertState({...alertState, open: false})}
          severity={alertState.severity}>
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;
