const Button = ({ label, onClick, disabled = false, variant = "primary" }) => {
    return(
       <button
       className={`btn btn--${variant}`}
       onClick={onClick}
       disabled={disabled}
       >
        {label}
       </button>
    );
}

export default Button