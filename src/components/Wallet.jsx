import React, { useEffect, useState } from "react";
import { Button, Modal, Spin, Tooltip, Typography } from "antd";
import { KeyOutlined, SettingOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import QR from "qrcode.react";

import Address from "./Address";
import WalletImport from "./WalletImport";

const { Text } = Typography;

/**
 ~ What it does? ~

 Displays a wallet where you can specify address and send USD/ETH, with options to
 scan address, to convert between USD and ETH, to see and generate private keys,
 to send, receive and extract the burner wallet

 ~ How can I use? ~

 <Wallet
 provider={userProvider}
 address={address}
 ensProvider={mainnetProvider}
 price={price}
 color='red'
 />

 ~ Features ~

 - Provide provider={userProvider} to display a wallet
 - Provide address={address} if you want to specify address, otherwise
 your default address will be used
 - Provide ensProvider={mainnetProvider} and your address will be replaced by ENS name
 (ex. "0xa870" => "user.eth") or you can enter directly ENS name instead of address
 - Provide price={price} of ether and easily convert between USD and ETH
 - Provide color to specify the color of wallet icon
 **/

export default function Wallet(props) {
  const [signerAddress, setSignerAddress] = useState();
  useEffect(() => {
    async function getAddress() {
      if (props.signer) {
        const newAddress = await props.signer.getAddress();
        setSignerAddress(newAddress);
      }
    }

    getAddress();
  }, [props.signer]);

  const selectedAddress = props.address || signerAddress;

  const [open, setOpen] = useState();
  const [qr, setQr] = useState();
  const [pk, setPK] = useState();

  const [showImport, setShowImport] = useState();

  const providerSend = props.provider ? (
    <Tooltip title="Wallet">
      <SettingOutlined
        onClick={() => {
          setOpen(!open);
        }}
        style={{
          padding: props.padding ? props.padding : 7,
          color: props.color ? props.color : "",
          cursor: "pointer",
          fontSize: props.size ? props.size : 28,
          verticalAlign: "middle",
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  const showImportButton = (
    <Button
      style={{ marginTop: 16 }}
      onClick={() => {
        setShowImport(true);
      }}
    >
      <span style={{ marginRight: 8 }}>💾</span>Log In
    </Button>
  );

  let display;
  let privateKeyButton;
  if (qr) {
    display = (
      <div>
        <div>
          <Text copyable>{selectedAddress}</Text>
        </div>
        <QR
          value={selectedAddress}
          size="450"
          level="H"
          includeMargin
          renderAs="svg"
          imageSettings={{ excavate: false }}
        />
      </div>
    );
    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK(selectedAddress);
          setQr("");
        }}
      >
        <KeyOutlined /> Private Key
      </Button>
    );
  } else if (pk) {
    const pk = localStorage.getItem("metaPrivateKey");
    const wallet = new ethers.Wallet(pk);

    if (wallet.address !== selectedAddress) {
      display = (
        <div>
          <b>*injected account*, private key unknown</b>
        </div>
      );
    } else {
      const extraPkDisplayAdded = {};
      const extraPkDisplay = [];
      extraPkDisplayAdded[wallet.address] = true;
      extraPkDisplay.push(
        <div style={{ fontSize: 16, padding: 2, backgroundStyle: "#89e789" }}>
          <a href={"/pk#" + pk}>
            <Address minimized address={wallet.address} ensProvider={props.ensProvider} /> {wallet.address.substr(0, 6)}
          </a>
        </div>,
      );
      for (const key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          const pastpk = localStorage.getItem(key);
          const pastwallet = new ethers.Wallet(pastpk);
          if (!extraPkDisplayAdded[pastwallet.address] /* && selectedAddress!=pastwallet.address */) {
            extraPkDisplayAdded[pastwallet.address] = true;
            extraPkDisplay.push(
              <div style={{ fontSize: 16 }}>
                <a href={"/pk#" + pastpk}>
                  <Address minimized address={pastwallet.address} ensProvider={props.ensProvider} />{" "}
                  {pastwallet.address.substr(0, 6)}
                </a>
              </div>,
            );
          }
        }
      }

      display = (
        <div>
          <div>
            <div>
              <i>
                Pressing "Save Access" will prompt your browser to save access to your account. You can then access your
                account using the saved credentials on this device or others.
              </i>
            </div>
            <br />

            <form id="pk">
              <span style={{ display: "none" }}>
                <input type="text" name="username" value={"Eco Wallet - " + selectedAddress} />
                <input type="password" name="password" value={pk} />
              </span>
              <button id="submitPk" type="submit" value="Save Access" action="#">
                Save Access
              </button>
            </form>

            <br />
          </div>
        </div>
      );
    }

    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK("");
          setQr("");
        }}
      >
        <KeyOutlined /> Hide
      </Button>
    );
  } else {
    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK(selectedAddress);
          setQr("");
        }}
      >
        <KeyOutlined /> Save Access
      </Button>
    );
  }

  return (
    <span>
      {providerSend}
      <Modal
        visible={open}
        title={
          <div>
            {selectedAddress ? <Address address={selectedAddress} ensProvider={props.ensProvider} /> : <Spin />}
          </div>
        }
        onOk={() => {
          setPK();
          setOpen(!open);
        }}
        onCancel={() => {
          setPK();
          setOpen(!open);
        }}
        footer={showImport ? null : [showImportButton, privateKeyButton]}
      >
        {showImport ? <WalletImport setShowImport={setShowImport} /> : display}
      </Modal>
    </span>
  );
}
