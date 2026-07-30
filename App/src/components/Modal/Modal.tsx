import "./Modal.css";

interface ModalProps {
    toggleModal(): void;
    content: JSX.Element;
}

export const Modal: React.FC<ModalProps> = ({ toggleModal, content }) => {
    return (
        <div className="modal-bg">
            <div className="modal">
                <h5 className="modal-exit" onClick={toggleModal}>x</h5>
                {content}
            </div>
        </div>
    )
}