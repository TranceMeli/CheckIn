import toast, {Toaster} from 'react-hot-toast';

const showToast = () => toast("Das ist eine Testnachricht!");


const Toast = () => {

    return(
        <div>
            <button onClick={showToast}>Klick for toast</button>
            <Toaster></Toaster>

        </div>
    );
};

export default Toast;