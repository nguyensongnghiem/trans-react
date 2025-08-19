function InfoCard(props) {
  const { header, content } = props;
  return (
    <div className="relative pl-7 py-1">
      <div className="font-normal text-gray-900">
        <svg
          className="absolute top-1 left-1 h-4 w-4 text-green-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          ></path>
        </svg>
        {header}
      </div>
      <dd className="mt-1 text-sm">{content}</dd>
    </div>
  );
}

export default InfoCard;
